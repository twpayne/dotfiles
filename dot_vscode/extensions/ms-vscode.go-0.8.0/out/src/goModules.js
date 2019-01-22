"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const path = require("path");
const cp = require("child_process");
const vscode = require("vscode");
const stateUtils_1 = require("./stateUtils");
const goInstallTools_1 = require("./goInstallTools");
function containsModFile(folderPath) {
    let goExecutable = util_1.getBinPath('go');
    if (!goExecutable) {
        return Promise.reject(new Error('Cannot find "go" binary. Update PATH or GOROOT appropriately.'));
    }
    return new Promise(resolve => {
        cp.execFile(goExecutable, ['env', 'GOMOD'], { cwd: folderPath, env: util_1.getToolsEnvVars() }, (err, stdout) => {
            if (err) {
                console.warn(`Error when running go env GOMOD: ${err}`);
                return resolve(false);
            }
            let [goMod] = stdout.split('\n');
            resolve(!!goMod);
        });
    });
}
const workspaceModCache = new Map();
const packageModCache = new Map();
function isModSupported(fileuri) {
    return util_1.getGoVersion().then(value => {
        if (value && (value.major !== 1 || value.minor < 11)) {
            return false;
        }
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileuri);
        if (workspaceFolder && workspaceModCache.get(workspaceFolder.uri.fsPath)) {
            return true;
        }
        const pkgPath = path.dirname(fileuri.fsPath);
        if (packageModCache.get(pkgPath)) {
            if (workspaceFolder && pkgPath === workspaceFolder.uri.fsPath) {
                workspaceModCache.set(workspaceFolder.uri.fsPath, true);
                logModuleUsage(true);
            }
            else {
                logModuleUsage(false);
            }
            return true;
        }
        return containsModFile(pkgPath).then(result => {
            packageModCache.set(pkgPath, result);
            if (result) {
                const goConfig = vscode.workspace.getConfiguration('go', fileuri);
                if (goConfig['inferGopath'] === true) {
                    goConfig.update('inferGopath', false, vscode.ConfigurationTarget.WorkspaceFolder);
                    alertDisablingInferGopath();
                }
            }
            else {
                let currentGopath = util_1.getCurrentGoPath();
                if (currentGopath) {
                    currentGopath = currentGopath.split(path.delimiter)[0];
                    if (fileuri.fsPath.startsWith(path.join(currentGopath, 'pkg', 'mod'))) {
                        return true;
                    }
                }
            }
            return result;
        });
    });
}
exports.isModSupported = isModSupported;
function updateWorkspaceModCache() {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }
    let inferGopathUpdated = false;
    const promises = vscode.workspace.workspaceFolders.map(folder => {
        return containsModFile(folder.uri.fsPath).then(result => {
            workspaceModCache.set(folder.uri.fsPath, result);
            if (result) {
                logModuleUsage(true);
                const goConfig = vscode.workspace.getConfiguration('go', folder.uri);
                if (goConfig['inferGopath'] === true) {
                    return goConfig.update('inferGopath', false, vscode.ConfigurationTarget.WorkspaceFolder)
                        .then(() => inferGopathUpdated = true);
                }
            }
        });
    });
    Promise.all(promises).then(() => {
        if (inferGopathUpdated) {
            alertDisablingInferGopath();
        }
    });
}
exports.updateWorkspaceModCache = updateWorkspaceModCache;
function alertDisablingInferGopath() {
    vscode.window.showInformationMessage('The "inferGopath" setting is disabled for this workspace because Go modules are being used.');
}
function logModuleUsage(atroot) {
    /* __GDPR__
        "modules" : {
            "atroot" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        }
    */
    util_1.sendTelemetryEvent('modules', {
        atroot: atroot ? 'true' : 'false'
    });
}
const promptedToolsForCurrentSession = new Set();
function promptToUpdateToolForModules(tool, promptMsg) {
    if (promptedToolsForCurrentSession.has(tool)) {
        return;
    }
    const promptedToolsForModules = stateUtils_1.getFromGlobalState('promptedToolsForModules', {});
    if (promptedToolsForModules[tool]) {
        return;
    }
    util_1.getGoVersion().then(goVersion => {
        vscode.window.showInformationMessage(promptMsg, 'Update', 'Later', `Don't show again`)
            .then(selected => {
            switch (selected) {
                case 'Update':
                    goInstallTools_1.installTools([tool], goVersion);
                    promptedToolsForModules[tool] = true;
                    stateUtils_1.updateGlobalState('promptedToolsForModules', promptedToolsForModules);
                    break;
                case `Don't show again`:
                    promptedToolsForModules[tool] = true;
                    stateUtils_1.updateGlobalState('promptedToolsForModules', promptedToolsForModules);
                    break;
                case 'Later':
                default:
                    promptedToolsForCurrentSession.add(tool);
                    break;
            }
        });
    });
}
exports.promptToUpdateToolForModules = promptToUpdateToolForModules;
const folderToPackageMapping = {};
function getCurrentPackage(cwd) {
    if (folderToPackageMapping[cwd]) {
        return Promise.resolve(folderToPackageMapping[cwd]);
    }
    let goRuntimePath = util_1.getBinPath('go');
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve(null);
    }
    return new Promise(resolve => {
        let childProcess = cp.spawn(goRuntimePath, ['list'], { cwd, env: util_1.getToolsEnvVars() });
        let chunks = [];
        childProcess.stdout.on('data', (stdout) => {
            chunks.push(stdout);
        });
        childProcess.on('close', () => {
            // Ignore lines that are empty or those that have logs about updating the module cache
            let pkgs = chunks.join('').toString().split('\n').filter(line => line && line.indexOf(' ') === -1);
            if (pkgs.length !== 1) {
                resolve();
                return;
            }
            folderToPackageMapping[cwd] = pkgs[0];
            resolve(pkgs[0]);
        });
    });
}
exports.getCurrentPackage = getCurrentPackage;
//# sourceMappingURL=goModules.js.map