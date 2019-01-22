/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This file is loaded by both the extension and debug adapter, so it cannot import 'vscode'
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
let binPathCache = {};
exports.envPath = process.env['PATH'] || (process.platform === 'win32' ? process.env['Path'] : null);
function getBinPathFromEnvVar(toolName, envVarValue, appendBinToPath) {
    toolName = correctBinname(toolName);
    if (envVarValue) {
        let paths = envVarValue.split(path.delimiter);
        for (let i = 0; i < paths.length; i++) {
            let binpath = path.join(paths[i], appendBinToPath ? 'bin' : '', toolName);
            if (fileExists(binpath)) {
                return binpath;
            }
        }
    }
    return null;
}
exports.getBinPathFromEnvVar = getBinPathFromEnvVar;
function getBinPathWithPreferredGopath(toolName, preferredGopaths, alternateTools) {
    if (binPathCache[toolName])
        return binPathCache[toolName];
    const alternateTool = (alternateTools && alternateTools[toolName]) ? resolveHomeDir(alternateTools[toolName]) : null;
    if (alternateTool && path.isAbsolute(alternateTool) && fileExists(alternateTool)) {
        binPathCache[toolName] = alternateTool;
        return alternateTool;
    }
    const binname = (alternateTool && !path.isAbsolute(alternateTool)) ? alternateTool : toolName;
    for (let i = 0; i < preferredGopaths.length; i++) {
        if (typeof preferredGopaths[i] === 'string') {
            // Search in the preferred GOPATH workspace's bin folder
            let pathFrompreferredGoPath = getBinPathFromEnvVar(binname, preferredGopaths[i], true);
            if (pathFrompreferredGoPath) {
                binPathCache[toolName] = pathFrompreferredGoPath;
                return pathFrompreferredGoPath;
            }
        }
    }
    // Check GOROOT (go, gofmt, godoc would be found here)
    let pathFromGoRoot = getBinPathFromEnvVar(binname, process.env['GOROOT'], true);
    if (pathFromGoRoot) {
        binPathCache[toolName] = pathFromGoRoot;
        return pathFromGoRoot;
    }
    // Finally search PATH parts
    let pathFromPath = getBinPathFromEnvVar(binname, exports.envPath, false);
    if (pathFromPath) {
        binPathCache[toolName] = pathFromPath;
        return pathFromPath;
    }
    // Check default path for go
    if (toolName === 'go') {
        let defaultPathForGo = process.platform === 'win32' ? 'C:\\Go\\bin\\go.exe' : '/usr/local/go/bin/go';
        if (fileExists(defaultPathForGo)) {
            binPathCache[toolName] = defaultPathForGo;
            return defaultPathForGo;
        }
        return;
    }
    // Else return the binary name directly (this will likely always fail downstream)
    return toolName;
}
exports.getBinPathWithPreferredGopath = getBinPathWithPreferredGopath;
function correctBinname(toolName) {
    if (process.platform === 'win32')
        return toolName + '.exe';
    else
        return toolName;
}
function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch (e) {
        return false;
    }
}
function clearCacheForTools() {
    binPathCache = {};
}
exports.clearCacheForTools = clearCacheForTools;
/**
 * Exapnds ~ to homedir in non-Windows platform
 */
function resolveHomeDir(inputPath) {
    if (!inputPath || !inputPath.trim())
        return inputPath;
    return inputPath.startsWith('~') ? path.join(os.homedir(), inputPath.substr(1)) : inputPath;
}
exports.resolveHomeDir = resolveHomeDir;
function stripBOM(s) {
    if (s && s[0] === '\uFEFF') {
        s = s.substr(1);
    }
    return s;
}
exports.stripBOM = stripBOM;
function parseEnvFile(path) {
    const env = {};
    if (!path) {
        return env;
    }
    try {
        const buffer = stripBOM(fs.readFileSync(path, 'utf8'));
        buffer.split('\n').forEach(line => {
            const r = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
            if (r !== null) {
                let value = r[2] || '';
                if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                    value = value.replace(/\\n/gm, '\n');
                }
                env[r[1]] = value.replace(/(^['"]|['"]$)/g, '');
            }
        });
        return env;
    }
    catch (e) {
        throw (`Cannot load environment variables from file ${path}`);
    }
}
exports.parseEnvFile = parseEnvFile;
// Walks up given folder path to return the closest ancestor that has `src` as a child
function getInferredGopath(folderPath) {
    if (!folderPath) {
        return;
    }
    let dirs = folderPath.toLowerCase().split(path.sep);
    // find src directory closest to given folder path
    let srcIdx = dirs.lastIndexOf('src');
    if (srcIdx > 0) {
        return folderPath.substr(0, dirs.slice(0, srcIdx).join(path.sep).length);
    }
}
exports.getInferredGopath = getInferredGopath;
/**
 * Returns the workspace in the given Gopath to which given directory path belongs to
 * @param gopath string Current Gopath. Can be ; or : separated (as per os) to support multiple paths
 * @param currentFileDirPath string
 */
function getCurrentGoWorkspaceFromGOPATH(gopath, currentFileDirPath) {
    if (!gopath) {
        return;
    }
    let workspaces = gopath.split(path.delimiter);
    let currentWorkspace = '';
    currentFileDirPath = fixDriveCasingInWindows(currentFileDirPath);
    // Find current workspace by checking if current file is
    // under any of the workspaces in $GOPATH
    for (let i = 0; i < workspaces.length; i++) {
        const possibleCurrentWorkspace = path.join(workspaces[i], 'src');
        if (currentFileDirPath.startsWith(possibleCurrentWorkspace)
            || (process.platform === 'win32' && currentFileDirPath.toLowerCase().startsWith(possibleCurrentWorkspace.toLowerCase()))) {
            // In case of nested workspaces, (example: both /Users/me and /Users/me/src/a/b/c are in $GOPATH)
            // both parent & child workspace in the nested workspaces pair can make it inside the above if block
            // Therefore, the below check will take longer (more specific to current file) of the two
            if (possibleCurrentWorkspace.length > currentWorkspace.length) {
                currentWorkspace = currentFileDirPath.substr(0, possibleCurrentWorkspace.length);
            }
        }
    }
    return currentWorkspace;
}
exports.getCurrentGoWorkspaceFromGOPATH = getCurrentGoWorkspaceFromGOPATH;
// Workaround for issue in https://github.com/Microsoft/vscode/issues/9448#issuecomment-244804026
function fixDriveCasingInWindows(pathToFix) {
    return (process.platform === 'win32' && pathToFix) ? pathToFix.substr(0, 1).toUpperCase() + pathToFix.substr(1) : pathToFix;
}
exports.fixDriveCasingInWindows = fixDriveCasingInWindows;
//# sourceMappingURL=goPath.js.map