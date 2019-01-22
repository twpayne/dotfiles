"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const goPath_1 = require("./goPath");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
let gopkgsNotified = false;
let cacheTimeout = 5000;
let gopkgsSubscriptions = new Map();
let gopkgsRunning = new Set();
let allPkgsCache = new Map();
let pkgRootDirs = new Map();
function gopkgs(workDir) {
    const gopkgsBinPath = util_1.getBinPath('gopkgs');
    if (!path.isAbsolute(gopkgsBinPath)) {
        goInstallTools_1.promptForMissingTool('gopkgs');
        return Promise.resolve(new Map());
    }
    let t0 = Date.now();
    return new Promise((resolve, reject) => {
        const args = ['-format', '{{.Name}};{{.ImportPath}}'];
        if (workDir) {
            args.push('-workDir', workDir);
        }
        const cmd = cp.spawn(gopkgsBinPath, args, { env: util_1.getToolsEnvVars() });
        const chunks = [];
        const errchunks = [];
        let err;
        cmd.stdout.on('data', d => chunks.push(d));
        cmd.stderr.on('data', d => errchunks.push(d));
        cmd.on('error', e => err = e);
        cmd.on('close', () => {
            let pkgs = new Map();
            if (err && err.code === 'ENOENT') {
                return goInstallTools_1.promptForMissingTool('gopkgs');
            }
            const errorMsg = errchunks.join('').trim() || (err && err.message);
            if (errorMsg) {
                if (errorMsg.startsWith('flag provided but not defined: -workDir')) {
                    goInstallTools_1.promptForUpdatingTool('gopkgs');
                    // fallback to gopkgs without -workDir
                    return gopkgs().then(result => resolve(result));
                }
                console.log(`Running gopkgs failed with "${errorMsg}"\nCheck if you can run \`gopkgs -format {{.Name}};{{.ImportPath}}\` in a terminal successfully.`);
                return resolve(pkgs);
            }
            const output = chunks.join('');
            if (output.indexOf(';') === -1) {
                // User might be using the old gopkgs tool, prompt to update
                goInstallTools_1.promptForUpdatingTool('gopkgs');
                output.split('\n').forEach(pkgPath => {
                    if (!pkgPath || !pkgPath.trim()) {
                        return;
                    }
                    let index = pkgPath.lastIndexOf('/');
                    let pkgName = index === -1 ? pkgPath : pkgPath.substr(index + 1);
                    pkgs.set(pkgPath, pkgName);
                });
                return resolve(pkgs);
            }
            output.split('\n').forEach((pkgDetail) => {
                if (!pkgDetail || !pkgDetail.trim() || pkgDetail.indexOf(';') === -1)
                    return;
                let [pkgName, pkgPath] = pkgDetail.trim().split(';');
                pkgs.set(pkgPath, pkgName);
            });
            let timeTaken = Date.now() - t0;
            /* __GDPR__
                "gopkgs" : {
                    "tool" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "timeTaken": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                }
            */
            util_1.sendTelemetryEvent('gopkgs', {}, { timeTaken });
            cacheTimeout = timeTaken > 5000 ? timeTaken : 5000;
            return resolve(pkgs);
        });
    });
}
function getAllPackagesNoCache(workDir) {
    return new Promise((resolve, reject) => {
        // Use subscription style to guard costly/long running invocation
        let callback = function (pkgMap) {
            resolve(pkgMap);
        };
        let subs = gopkgsSubscriptions.get(workDir);
        if (!subs) {
            subs = [];
            gopkgsSubscriptions.set(workDir, subs);
        }
        subs.push(callback);
        // Ensure only single gokpgs running
        if (!gopkgsRunning.has(workDir)) {
            gopkgsRunning.add(workDir);
            gopkgs(workDir).then((pkgMap) => {
                gopkgsRunning.delete(workDir);
                gopkgsSubscriptions.delete(workDir);
                subs.forEach((callback) => callback(pkgMap));
            });
        }
    });
}
/**
 * Runs gopkgs
 * @argument workDir. The workspace directory of the project.
 * @returns Map<string, string> mapping between package import path and package name
 */
function getAllPackages(workDir) {
    let cache = allPkgsCache.get(workDir);
    let useCache = cache && (new Date().getTime() - cache.lastHit) < cacheTimeout;
    if (useCache) {
        cache.lastHit = new Date().getTime();
        return Promise.resolve(cache.entry);
    }
    return getAllPackagesNoCache(workDir).then((pkgs) => {
        if (!pkgs || pkgs.size === 0) {
            if (!gopkgsNotified) {
                vscode.window.showInformationMessage('Could not find packages. Ensure `gopkgs -format {{.Name}};{{.ImportPath}}` runs successfully.');
                gopkgsNotified = true;
            }
        }
        allPkgsCache.set(workDir, {
            entry: pkgs,
            lastHit: new Date().getTime()
        });
        return pkgs;
    });
}
exports.getAllPackages = getAllPackages;
/**
 * Returns mapping of import path and package name for packages that can be imported
 * Possible to return empty if useCache options is used.
 * @param filePath. Used to determine the right relative path for vendor pkgs
 * @param useCache. Force to use cache
 * @returns Map<string, string> mapping between package import path and package name
 */
function getImportablePackages(filePath, useCache = false) {
    filePath = goPath_1.fixDriveCasingInWindows(filePath);
    let getAllPackagesPromise;
    let fileDirPath = path.dirname(filePath);
    let foundPkgRootDir = pkgRootDirs.get(fileDirPath);
    let workDir = foundPkgRootDir || fileDirPath;
    let cache = allPkgsCache.get(workDir);
    if (useCache && cache) {
        getAllPackagesPromise = Promise.race([getAllPackages(workDir), cache.entry]);
    }
    else {
        getAllPackagesPromise = getAllPackages(workDir);
    }
    return Promise.all([util_1.isVendorSupported(), getAllPackagesPromise]).then(([vendorSupported, pkgs]) => {
        let pkgMap = new Map();
        if (!pkgs) {
            return pkgMap;
        }
        let currentWorkspace = goPath_1.getCurrentGoWorkspaceFromGOPATH(util_1.getCurrentGoPath(), fileDirPath);
        pkgs.forEach((pkgName, pkgPath) => {
            if (pkgName === 'main') {
                return;
            }
            if (!vendorSupported || !currentWorkspace) {
                pkgMap.set(pkgPath, pkgName);
                return;
            }
            if (!foundPkgRootDir) {
                // try to guess package root dir
                let vendorIndex = pkgPath.indexOf('/vendor/');
                if (vendorIndex !== -1) {
                    foundPkgRootDir = path.join(currentWorkspace, pkgPath.substring(0, vendorIndex).replace('/', path.sep));
                    pkgRootDirs.set(fileDirPath, foundPkgRootDir);
                }
            }
            let relativePkgPath = getRelativePackagePath(fileDirPath, currentWorkspace, pkgPath);
            if (!relativePkgPath) {
                return;
            }
            let allowToImport = isAllowToImportPackage(fileDirPath, currentWorkspace, relativePkgPath);
            if (allowToImport) {
                pkgMap.set(relativePkgPath, pkgName);
            }
        });
        return pkgMap;
    });
}
exports.getImportablePackages = getImportablePackages;
/**
 * If given pkgPath is not vendor pkg, then the same pkgPath is returned
 * Else, the import path for the vendor pkg relative to given filePath is returned.
 */
function getRelativePackagePath(currentFileDirPath, currentWorkspace, pkgPath) {
    let magicVendorString = '/vendor/';
    let vendorIndex = pkgPath.indexOf(magicVendorString);
    if (vendorIndex === -1) {
        magicVendorString = 'vendor/';
        if (pkgPath.startsWith(magicVendorString)) {
            vendorIndex = 0;
        }
    }
    // Check if current file and the vendor pkg belong to the same root project and not sub vendor
    // If yes, then vendor pkg can be replaced with its relative path to the "vendor" folder
    // If not, then the vendor pkg should not be allowed to be imported.
    if (vendorIndex > -1) {
        let rootProjectForVendorPkg = path.join(currentWorkspace, pkgPath.substr(0, vendorIndex));
        let relativePathForVendorPkg = pkgPath.substring(vendorIndex + magicVendorString.length);
        let subVendor = relativePathForVendorPkg.indexOf('/vendor/') !== -1;
        if (relativePathForVendorPkg && currentFileDirPath.startsWith(rootProjectForVendorPkg) && !subVendor) {
            return relativePathForVendorPkg;
        }
        return '';
    }
    return pkgPath;
}
const pkgToFolderMappingRegex = /ImportPath: (.*) FolderPath: (.*)/;
/**
 * Returns mapping between import paths and folder paths for all packages under given folder (vendor will be excluded)
 */
function getNonVendorPackages(folderPath) {
    let goRuntimePath = util_1.getBinPath('go');
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
        let childProcess = cp.spawn(goRuntimePath, ['list', '-f', 'ImportPath: {{.ImportPath}} FolderPath: {{.Dir}}', './...'], { cwd: folderPath, env: util_1.getToolsEnvVars() });
        let chunks = [];
        childProcess.stdout.on('data', (stdout) => {
            chunks.push(stdout);
        });
        childProcess.on('close', (status) => {
            let lines = chunks.join('').toString().split('\n');
            util_1.getGoVersion().then((ver) => {
                const result = new Map();
                const vendorAlreadyExcluded = !ver || ver.major > 1 || (ver.major === 1 && ver.minor >= 9);
                lines.forEach(line => {
                    const matches = line.match(pkgToFolderMappingRegex);
                    if (!matches || matches.length !== 3) {
                        return;
                    }
                    let [_, pkgPath, folderPath] = matches;
                    if (!pkgPath || (!vendorAlreadyExcluded && pkgPath.includes('/vendor/'))) {
                        return;
                    }
                    result.set(pkgPath, folderPath);
                });
                resolve(result);
            });
        });
    });
}
exports.getNonVendorPackages = getNonVendorPackages;
// This will check whether it's regular package or internal package
// Regular package will always allowed
// Internal package only allowed if the package doing the import is within the tree rooted at the parent of "internal" directory
// see: https://golang.org/doc/go1.4#internalpackages
// see: https://golang.org/s/go14internal
function isAllowToImportPackage(toDirPath, currentWorkspace, pkgPath) {
    if (pkgPath.startsWith('internal/')) {
        return false;
    }
    let internalPkgFound = pkgPath.match(/\/internal\/|\/internal$/);
    if (internalPkgFound) {
        let rootProjectForInternalPkg = path.join(currentWorkspace, pkgPath.substr(0, internalPkgFound.index));
        return toDirPath.startsWith(rootProjectForInternalPkg + path.sep) || toDirPath === rootProjectForInternalPkg;
    }
    return true;
}
//# sourceMappingURL=goPackages.js.map