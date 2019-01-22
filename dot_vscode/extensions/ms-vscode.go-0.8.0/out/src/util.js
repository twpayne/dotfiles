"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const goPath_1 = require("./goPath");
const cp = require("child_process");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const fs = require("fs");
const os = require("os");
const goStatus_1 = require("./goStatus");
const avlTree_1 = require("./avlTree");
const goModules_1 = require("./goModules");
const goMain_1 = require("./goMain");
const extensionId = 'ms-vscode.Go';
const extensionVersion = vscode.extensions.getExtension(extensionId).packageJSON.version;
const aiKey = 'AIF-d9b70cd4-b9f9-4d70-929b-a071c400b217';
let userNameHash = 0;
exports.goKeywords = [
    'break',
    'case',
    'chan',
    'const',
    'continue',
    'default',
    'defer',
    'else',
    'fallthrough',
    'for',
    'func',
    'go',
    'goto',
    'if',
    'import',
    'interface',
    'map',
    'package',
    'range',
    'return',
    'select',
    'struct',
    'switch',
    'type',
    'var'
];
exports.goBuiltinTypes = new Set([
    'bool',
    'byte',
    'complex128',
    'complex64',
    'error',
    'float32',
    'float64',
    'int',
    'int16',
    'int32',
    'int64',
    'int8',
    'rune',
    'string',
    'uint',
    'uint16',
    'uint32',
    'uint64',
    'uint8',
    'uintptr'
]);
let goVersion = null;
let vendorSupport = null;
let telemtryReporter;
let toolsGopath;
function byteOffsetAt(document, position) {
    let offset = document.offsetAt(position);
    let text = document.getText();
    return Buffer.byteLength(text.substr(0, offset));
}
exports.byteOffsetAt = byteOffsetAt;
function parseFilePrelude(text) {
    let lines = text.split('\n');
    let ret = { imports: [], pkg: null };
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let pkgMatch = line.match(/^(\s)*package(\s)+(\w+)/);
        if (pkgMatch) {
            ret.pkg = { start: i, end: i, name: pkgMatch[3] };
        }
        if (line.match(/^(\s)*import(\s)+\(/)) {
            ret.imports.push({ kind: 'multi', start: i, end: -1, pkgs: [] });
        }
        if (line.match(/^(\s)*import(\s)+[^\(]/)) {
            ret.imports.push({ kind: 'single', start: i, end: i, pkgs: [] });
        }
        if (line.match(/^(\s)*(\/\*.*\*\/)*\s*\)/)) {
            if (ret.imports[ret.imports.length - 1].end === -1) {
                ret.imports[ret.imports.length - 1].end = i;
            }
        }
        else if (ret.imports.length) {
            if (ret.imports[ret.imports.length - 1].end === -1) {
                const pkgMatch = line.match(/"([^"]+)"/);
                if (pkgMatch) {
                    ret.imports[ret.imports.length - 1].pkgs.push(pkgMatch[1]);
                }
            }
        }
        if (line.match(/^(\s)*(func|const|type|var)\s/)) {
            break;
        }
    }
    return ret;
}
exports.parseFilePrelude = parseFilePrelude;
// Takes a Go function signature like:
//     (foo, bar string, baz number) (string, string)
// and returns an array of parameter strings:
//     ["foo", "bar string", "baz string"]
// Takes care of balancing parens so to not get confused by signatures like:
//     (pattern string, handler func(ResponseWriter, *Request)) {
function getParametersAndReturnType(signature) {
    let params = [];
    let parenCount = 0;
    let lastStart = 1;
    for (let i = 1; i < signature.length; i++) {
        switch (signature[i]) {
            case '(':
                parenCount++;
                break;
            case ')':
                parenCount--;
                if (parenCount < 0) {
                    if (i > lastStart) {
                        params.push(signature.substring(lastStart, i));
                    }
                    return {
                        params,
                        returnType: i < signature.length - 1 ? signature.substr(i + 1) : ''
                    };
                }
                break;
            case ',':
                if (parenCount === 0) {
                    params.push(signature.substring(lastStart, i));
                    lastStart = i + 2;
                }
                break;
        }
    }
    return { params: [], returnType: '' };
}
exports.getParametersAndReturnType = getParametersAndReturnType;
function canonicalizeGOPATHPrefix(filename) {
    let gopath = getCurrentGoPath();
    if (!gopath)
        return filename;
    let workspaces = gopath.split(path.delimiter);
    let filenameLowercase = filename.toLowerCase();
    // In case of multiple workspaces, find current workspace by checking if current file is
    // under any of the workspaces in $GOPATH
    let currentWorkspace = null;
    for (let workspace of workspaces) {
        // In case of nested workspaces, (example: both /Users/me and /Users/me/a/b/c are in $GOPATH)
        // both parent & child workspace in the nested workspaces pair can make it inside the above if block
        // Therefore, the below check will take longer (more specific to current file) of the two
        if (filenameLowercase.substring(0, workspace.length) === workspace.toLowerCase()
            && (!currentWorkspace || workspace.length > currentWorkspace.length)) {
            currentWorkspace = workspace;
        }
    }
    if (!currentWorkspace)
        return filename;
    return currentWorkspace + filename.slice(currentWorkspace.length);
}
exports.canonicalizeGOPATHPrefix = canonicalizeGOPATHPrefix;
/**
 * Gets a numeric hash based on given string.
 * Returns a number between 0 and 4294967295.
 */
function getStringHash(value) {
    let hash = 5381, i = value.length;
    while (i) {
        hash = (hash * 33) ^ value.charCodeAt(--i);
    }
    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
        * integers. Since we want the results to be always positive, convert the
        * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;
}
exports.getStringHash = getStringHash;
function getUserNameHash() {
    if (userNameHash) {
        return userNameHash;
    }
    try {
        userNameHash = getStringHash(os.userInfo().username);
    }
    catch (error) {
        userNameHash = 1;
    }
    return userNameHash;
}
exports.getUserNameHash = getUserNameHash;
/**
 * Gets version of Go based on the output of the command `go version`.
 * Returns null if go is being used from source/tip in which case `go version` will not return release tag like go1.6.3
 */
function getGoVersion() {
    let goRuntimePath = getBinPath('go');
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve(null);
    }
    if (goVersion) {
        /* __GDPR__
           "getGoVersion" : {
              "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
           }
         */
        sendTelemetryEvent('getGoVersion', { version: `${goVersion.major}.${goVersion.minor}` });
        return Promise.resolve(goVersion);
    }
    return new Promise((resolve, reject) => {
        cp.execFile(goRuntimePath, ['version'], {}, (err, stdout, stderr) => {
            let matches = /go version go(\d).(\d+).*/.exec(stdout);
            if (matches) {
                goVersion = {
                    major: parseInt(matches[1]),
                    minor: parseInt(matches[2])
                };
                /* __GDPR__
                   "getGoVersion" : {
                      "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                   }
                 */
                sendTelemetryEvent('getGoVersion', { version: `${goVersion.major}.${goVersion.minor}` });
            }
            else {
                /* __GDPR__
                   "getGoVersion" : {
                      "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                   }
                 */
                sendTelemetryEvent('getGoVersion', { version: stdout });
            }
            return resolve(goVersion);
        });
    });
}
exports.getGoVersion = getGoVersion;
/**
 * Returns boolean denoting if current version of Go supports vendoring
 */
function isVendorSupported() {
    if (vendorSupport != null) {
        return Promise.resolve(vendorSupport);
    }
    return getGoVersion().then(version => {
        if (!version) {
            return process.env['GO15VENDOREXPERIMENT'] === '0' ? false : true;
        }
        switch (version.major) {
            case 0:
                vendorSupport = false;
                break;
            case 1:
                vendorSupport = (version.minor > 6 || ((version.minor === 5 || version.minor === 6) && process.env['GO15VENDOREXPERIMENT'] === '1')) ? true : false;
                break;
            default:
                vendorSupport = true;
                break;
        }
        return vendorSupport;
    });
}
exports.isVendorSupported = isVendorSupported;
/**
 * Returns boolean indicating if GOPATH is set or not
 * If not set, then prompts user to do set GOPATH
 */
function isGoPathSet() {
    if (!getCurrentGoPath()) {
        vscode.window.showInformationMessage('Set GOPATH environment variable and restart VS Code or set GOPATH in Workspace settings', 'Set GOPATH in Workspace Settings').then(selected => {
            if (selected === 'Set GOPATH in Workspace Settings') {
                vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
            }
        });
        return false;
    }
    return true;
}
exports.isGoPathSet = isGoPathSet;
function sendTelemetryEvent(eventName, properties, measures) {
    telemtryReporter = telemtryReporter ? telemtryReporter : new vscode_extension_telemetry_1.default(extensionId, extensionVersion, aiKey);
    telemtryReporter.sendTelemetryEvent(eventName, properties, measures);
}
exports.sendTelemetryEvent = sendTelemetryEvent;
function disposeTelemetryReporter() {
    if (telemtryReporter) {
        return telemtryReporter.dispose();
    }
    return Promise.resolve(null);
}
exports.disposeTelemetryReporter = disposeTelemetryReporter;
function isPositionInString(document, position) {
    let lineText = document.lineAt(position.line).text;
    let lineTillCurrentPosition = lineText.substr(0, position.character);
    // Count the number of double quotes in the line till current position. Ignore escaped double quotes
    let doubleQuotesCnt = (lineTillCurrentPosition.match(/\"/g) || []).length;
    let escapedDoubleQuotesCnt = (lineTillCurrentPosition.match(/\\\"/g) || []).length;
    doubleQuotesCnt -= escapedDoubleQuotesCnt;
    return doubleQuotesCnt % 2 === 1;
}
exports.isPositionInString = isPositionInString;
function getToolsGopath(useCache = true) {
    if (!useCache || !toolsGopath) {
        toolsGopath = resolveToolsGopath();
    }
    return toolsGopath;
}
exports.getToolsGopath = getToolsGopath;
function resolveToolsGopath() {
    let toolsGopathForWorkspace = substituteEnv(vscode.workspace.getConfiguration('go')['toolsGopath'] || '');
    // In case of single root
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length <= 1) {
        return resolvePath(toolsGopathForWorkspace);
    }
    // In case of multi-root, resolve ~ and ${workspaceFolder}
    if (toolsGopathForWorkspace.startsWith('~')) {
        toolsGopathForWorkspace = path.join(os.homedir(), toolsGopathForWorkspace.substr(1));
    }
    if (toolsGopathForWorkspace && toolsGopathForWorkspace.trim() && !/\${workspaceFolder}|\${workspaceRoot}/.test(toolsGopathForWorkspace)) {
        return toolsGopathForWorkspace;
    }
    // If any of the folders in multi root have toolsGopath set, use it.
    for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
        let toolsGopath = vscode.workspace.getConfiguration('go', vscode.workspace.workspaceFolders[i].uri).inspect('toolsGopath').workspaceFolderValue;
        toolsGopath = resolvePath(toolsGopath, vscode.workspace.workspaceFolders[i].uri.fsPath);
        if (toolsGopath) {
            return toolsGopath;
        }
    }
}
function getBinPath(tool) {
    return goPath_1.getBinPathWithPreferredGopath(tool, (tool === 'go') ? [] : [getToolsGopath(), getCurrentGoPath()], vscode.workspace.getConfiguration('go', null).get('alternateTools'));
}
exports.getBinPath = getBinPath;
function getFileArchive(document) {
    let fileContents = document.getText();
    return document.fileName + '\n' + Buffer.byteLength(fileContents, 'utf8') + '\n' + fileContents;
}
exports.getFileArchive = getFileArchive;
function getToolsEnvVars() {
    const config = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
    const toolsEnvVars = config['toolsEnvVars'];
    const gopath = getCurrentGoPath();
    const envVars = Object.assign({}, process.env, gopath ? { GOPATH: gopath } : {});
    if (toolsEnvVars && typeof toolsEnvVars === 'object') {
        Object.keys(toolsEnvVars).forEach(key => envVars[key] = typeof toolsEnvVars[key] === 'string' ? resolvePath(toolsEnvVars[key]) : toolsEnvVars[key]);
    }
    // cgo expects go to be in the path
    const goroot = envVars['GOROOT'];
    let pathEnvVar;
    if (envVars.hasOwnProperty('PATH')) {
        pathEnvVar = 'PATH';
    }
    else if (process.platform === 'win32' && envVars.hasOwnProperty('Path')) {
        pathEnvVar = 'Path';
    }
    if (goroot && pathEnvVar && envVars[pathEnvVar] && envVars[pathEnvVar].split(path.delimiter).indexOf(goroot) === -1) {
        envVars[pathEnvVar] += path.delimiter + path.join(goroot, 'bin');
    }
    return envVars;
}
exports.getToolsEnvVars = getToolsEnvVars;
function substituteEnv(input) {
    return input.replace(/\${env:([^}]+)}/g, function (match, capture) {
        return process.env[capture.trim()] || '';
    });
}
exports.substituteEnv = substituteEnv;
function getCurrentGoPath(workspaceUri) {
    let currentFilePath;
    if (vscode.window.activeTextEditor && vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)) {
        workspaceUri = workspaceUri || vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri;
        currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
    }
    const config = vscode.workspace.getConfiguration('go', workspaceUri);
    let currentRoot = workspaceUri ? workspaceUri.fsPath : vscode.workspace.rootPath;
    // Workaround for issue in https://github.com/Microsoft/vscode/issues/9448#issuecomment-244804026
    if (process.platform === 'win32') {
        currentRoot = goPath_1.fixDriveCasingInWindows(currentRoot) || '';
        currentFilePath = goPath_1.fixDriveCasingInWindows(currentFilePath) || '';
    }
    // Infer the GOPATH from the current root or the path of the file opened in current editor
    // Last resort: Check for the common case where GOPATH itself is opened directly in VS Code
    let inferredGopath;
    if (config['inferGopath'] === true) {
        inferredGopath = goPath_1.getInferredGopath(currentRoot) || goPath_1.getInferredGopath(currentFilePath);
        if (!inferredGopath) {
            try {
                if (fs.statSync(path.join(currentRoot, 'src')).isDirectory()) {
                    inferredGopath = currentRoot;
                }
            }
            catch (e) {
                // No op
            }
        }
        if (inferredGopath && process.env['GOPATH'] && inferredGopath !== process.env['GOPATH']) {
            inferredGopath += path.delimiter + process.env['GOPATH'];
        }
    }
    let configGopath = config['gopath'] ? resolvePath(substituteEnv(config['gopath']), currentRoot) : '';
    return inferredGopath ? inferredGopath : (configGopath || process.env['GOPATH']);
}
exports.getCurrentGoPath = getCurrentGoPath;
function getExtensionCommands() {
    let pkgJSON = vscode.extensions.getExtension(extensionId).packageJSON;
    if (!pkgJSON.contributes || !pkgJSON.contributes.commands) {
        return;
    }
    let extensionCommands = vscode.extensions.getExtension(extensionId).packageJSON.contributes.commands.filter(x => x.command !== 'go.show.commands');
    return extensionCommands;
}
exports.getExtensionCommands = getExtensionCommands;
class LineBuffer {
    constructor() {
        this.buf = '';
        this.lineListeners = [];
        this.lastListeners = [];
    }
    append(chunk) {
        this.buf += chunk;
        do {
            const idx = this.buf.indexOf('\n');
            if (idx === -1) {
                break;
            }
            this.fireLine(this.buf.substring(0, idx));
            this.buf = this.buf.substring(idx + 1);
        } while (true);
    }
    done() {
        this.fireDone(this.buf !== '' ? this.buf : null);
    }
    fireLine(line) {
        this.lineListeners.forEach(listener => listener(line));
    }
    fireDone(last) {
        this.lastListeners.forEach(listener => listener(last));
    }
    onLine(listener) {
        this.lineListeners.push(listener);
    }
    onDone(listener) {
        this.lastListeners.push(listener);
    }
}
exports.LineBuffer = LineBuffer;
function timeout(millis) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), millis);
    });
}
exports.timeout = timeout;
/**
 * Expands ~ to homedir in non-Windows platform and resolves ${workspaceFolder} or ${workspaceRoot}
 */
function resolvePath(inputPath, workspaceFolder) {
    if (!inputPath || !inputPath.trim())
        return inputPath;
    if (!workspaceFolder && vscode.workspace.workspaceFolders) {
        if (vscode.workspace.workspaceFolders.length === 1) {
            workspaceFolder = vscode.workspace.rootPath;
        }
        else if (vscode.window.activeTextEditor && vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)) {
            workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri.fsPath;
        }
    }
    if (workspaceFolder) {
        inputPath = inputPath.replace(/\${workspaceFolder}|\${workspaceRoot}/g, workspaceFolder);
    }
    return goPath_1.resolveHomeDir(inputPath);
}
exports.resolvePath = resolvePath;
/**
 * Returns the import path in a passed in string.
 * @param text The string to search for an import path
 */
function getImportPath(text) {
    // Catch cases like `import alias "importpath"` and `import "importpath"`
    let singleLineImportMatches = text.match(/^\s*import\s+([a-z,A-Z,_,\.]\w*\s+)?\"([^\"]+)\"/);
    if (singleLineImportMatches) {
        return singleLineImportMatches[2];
    }
    // Catch cases like `alias "importpath"` and "importpath"
    let groupImportMatches = text.match(/^\s*([a-z,A-Z,_,\.]\w*\s+)?\"([^\"]+)\"/);
    if (groupImportMatches) {
        return groupImportMatches[2];
    }
    return '';
}
exports.getImportPath = getImportPath;
// TODO: Add unit tests for the below
/**
 * Guess the package name based on parent directory name of the given file
 *
 * Cases:
 * - dir 'go-i18n' -> 'i18n'
 * - dir 'go-spew' -> 'spew'
 * - dir 'kingpin' -> 'kingpin'
 * - dir 'go-expand-tilde' -> 'tilde'
 * - dir 'gax-go' -> 'gax'
 * - dir 'go-difflib' -> 'difflib'
 * - dir 'jwt-go' -> 'jwt'
 * - dir 'go-radix' -> 'radix'
 *
 * @param {string} filePath.
 */
function guessPackageNameFromFile(filePath) {
    return new Promise((resolve, reject) => {
        const goFilename = path.basename(filePath);
        if (goFilename === 'main.go') {
            return resolve(['main']);
        }
        const directoryPath = path.dirname(filePath);
        const dirName = path.basename(directoryPath);
        let segments = dirName.split(/[\.-]/);
        segments = segments.filter(val => val !== 'go');
        if (segments.length === 0 || !/[a-zA-Z_]\w*/.test(segments[segments.length - 1])) {
            return reject();
        }
        const proposedPkgName = segments[segments.length - 1];
        fs.stat(path.join(directoryPath, 'main.go'), (err, stats) => {
            if (stats && stats.isFile()) {
                return resolve(['main']);
            }
            if (goFilename.endsWith('_test.go')) {
                return resolve([proposedPkgName, proposedPkgName + '_test']);
            }
            return resolve([proposedPkgName]);
        });
    });
}
exports.guessPackageNameFromFile = guessPackageNameFromFile;
/**
 * Runs given Go tool and returns errors/warnings that can be fed to the Problems Matcher
 * @param args Arguments to be passed while running given tool
 * @param cwd cwd that will passed in the env object while running given tool
 * @param severity error or warning
 * @param useStdErr If true, the stderr of the output of the given tool will be used, else stdout will be used
 * @param toolName The name of the Go tool to run. If none is provided, the go runtime itself is used
 * @param printUnexpectedOutput If true, then output that doesnt match expected format is printed to the output channel
 */
function runTool(args, cwd, severity, useStdErr, toolName, env, printUnexpectedOutput, token) {
    let goRuntimePath = getBinPath('go');
    let cmd;
    if (toolName) {
        cmd = getBinPath(toolName);
    }
    else {
        if (!goRuntimePath) {
            return Promise.reject(new Error('Cannot find "go" binary. Update PATH or GOROOT appropriately'));
        }
        cmd = goRuntimePath;
    }
    let p;
    if (token) {
        token.onCancellationRequested(() => {
            if (p) {
                killTree(p.pid);
            }
        });
    }
    cwd = goPath_1.fixDriveCasingInWindows(cwd);
    return new Promise((resolve, reject) => {
        p = cp.execFile(cmd, args, { env: env, cwd: cwd }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    // Since the tool is run on save which can be frequent
                    // we avoid sending explicit notification if tool is missing
                    console.log(`Cannot find ${toolName ? toolName : goRuntimePath}`);
                    return resolve([]);
                }
                if (err && stderr && !useStdErr) {
                    goStatus_1.outputChannel.appendLine(['Error while running tool:', cmd, ...args].join(' '));
                    goStatus_1.outputChannel.appendLine(stderr);
                    return resolve([]);
                }
                let lines = (useStdErr ? stderr : stdout).toString().split('\n');
                goStatus_1.outputChannel.appendLine([cwd + '>Finished running tool:', cmd, ...args].join(' '));
                let ret = [];
                let unexpectedOutput = false;
                let atleastSingleMatch = false;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i][0] === '\t' && ret.length > 0) {
                        ret[ret.length - 1].msg += '\n' + lines[i];
                        continue;
                    }
                    let match = /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+)?)?:(?:\w+:)? (.*)$/.exec(lines[i]);
                    if (!match) {
                        if (printUnexpectedOutput && useStdErr && stderr)
                            unexpectedOutput = true;
                        continue;
                    }
                    atleastSingleMatch = true;
                    let [_, __, file, ___, lineStr, ____, colStr, msg] = match;
                    let line = +lineStr;
                    let col = +colStr;
                    // Building skips vendor folders,
                    // But vet and lint take in directories and not import paths, so no way to skip them
                    // So prune out the results from vendor folders herehere.
                    if (!path.isAbsolute(file) && (file.startsWith(`vendor${path.sep}`) || file.indexOf(`${path.sep}vendor${path.sep}`) > -1)) {
                        continue;
                    }
                    file = path.resolve(cwd, file);
                    ret.push({ file, line, col, msg, severity });
                    goStatus_1.outputChannel.appendLine(`${file}:${line}: ${msg}`);
                }
                if (!atleastSingleMatch && unexpectedOutput && vscode.window.activeTextEditor) {
                    goStatus_1.outputChannel.appendLine(stderr);
                    if (err) {
                        ret.push({
                            file: vscode.window.activeTextEditor.document.fileName,
                            line: 1,
                            col: 1,
                            msg: stderr,
                            severity: 'error'
                        });
                    }
                }
                goStatus_1.outputChannel.appendLine('');
                resolve(ret);
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
exports.runTool = runTool;
function handleDiagnosticErrors(document, errors, diagnosticCollection) {
    diagnosticCollection.clear();
    let diagnosticMap = new Map();
    errors.forEach(error => {
        let canonicalFile = vscode.Uri.file(error.file).toString();
        let startColumn = 0;
        let endColumn = 1;
        if (document && document.uri.toString() === canonicalFile) {
            let range = new vscode.Range(error.line - 1, 0, error.line - 1, document.lineAt(error.line - 1).range.end.character + 1);
            let text = document.getText(range);
            let [_, leading, trailing] = /^(\s*).*(\s*)$/.exec(text);
            if (!error.col) {
                startColumn = leading.length;
            }
            else {
                startColumn = error.col - 1; // range is 0-indexed
            }
            endColumn = text.length - trailing.length;
        }
        let range = new vscode.Range(error.line - 1, startColumn, error.line - 1, endColumn);
        let severity = mapSeverityToVSCodeSeverity(error.severity);
        let diagnostic = new vscode.Diagnostic(range, error.msg, severity);
        diagnostic.source = diagnosticCollection.name;
        let diagnostics = diagnosticMap.get(canonicalFile);
        if (!diagnostics) {
            diagnostics = [];
        }
        diagnostics.push(diagnostic);
        diagnosticMap.set(canonicalFile, diagnostics);
    });
    diagnosticMap.forEach((newDiagnostics, file) => {
        const fileUri = vscode.Uri.parse(file);
        if (diagnosticCollection === goMain_1.buildDiagnosticCollection) {
            // If there are lint/vet warnings on current file, remove the ones co-inciding with the new build errors
            if (goMain_1.lintDiagnosticCollection.has(fileUri)) {
                goMain_1.lintDiagnosticCollection.set(fileUri, deDupeDiagnostics(newDiagnostics, goMain_1.lintDiagnosticCollection.get(fileUri)));
            }
            if (goMain_1.vetDiagnosticCollection.has(fileUri)) {
                goMain_1.vetDiagnosticCollection.set(fileUri, deDupeDiagnostics(newDiagnostics, goMain_1.vetDiagnosticCollection.get(fileUri)));
            }
        }
        else if (goMain_1.buildDiagnosticCollection.has(fileUri)) {
            // If there are build errors on current file, ignore the new lint/vet warnings co-inciding with them
            newDiagnostics = deDupeDiagnostics(goMain_1.buildDiagnosticCollection.get(fileUri), newDiagnostics);
        }
        diagnosticCollection.set(fileUri, newDiagnostics);
    });
}
exports.handleDiagnosticErrors = handleDiagnosticErrors;
function deDupeDiagnostics(buildDiagnostics, otherDiagnostics) {
    const buildDiagnosticsLines = buildDiagnostics.map(x => x.range.start.line);
    return otherDiagnostics.filter(x => buildDiagnosticsLines.indexOf(x.range.start.line) === -1);
}
function mapSeverityToVSCodeSeverity(sev) {
    switch (sev) {
        case 'error': return vscode.DiagnosticSeverity.Error;
        case 'warning': return vscode.DiagnosticSeverity.Warning;
        default: return vscode.DiagnosticSeverity.Error;
    }
}
function getWorkspaceFolderPath(fileUri) {
    if (fileUri) {
        let workspace = vscode.workspace.getWorkspaceFolder(fileUri);
        if (workspace) {
            return workspace.uri.fsPath;
        }
    }
    // fall back to the first workspace
    let folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length) {
        return folders[0].uri.fsPath;
    }
}
exports.getWorkspaceFolderPath = getWorkspaceFolderPath;
function killProcess(p) {
    if (p) {
        try {
            p.kill();
        }
        catch (e) {
            console.log('Error killing process: ' + e);
            if (e && e.message && e.stack) {
                let matches = e.stack.match(/(src.go[a-z,A-Z]+\.js)/g);
                if (matches) {
                    /* __GDPR__
                       "errorKillingProcess" : {
                          "message" : { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                          "stack": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" }
                       }
                     */
                    sendTelemetryEvent('errorKillingProcess', { message: e.message, stack: matches });
                }
            }
        }
    }
}
exports.killProcess = killProcess;
function killTree(processId) {
    if (process.platform === 'win32') {
        const TASK_KILL = 'C:\\Windows\\System32\\taskkill.exe';
        // when killing a process in Windows its child processes are *not* killed but become root processes.
        // Therefore we use TASKKILL.EXE
        try {
            cp.execSync(`${TASK_KILL} /F /T /PID ${processId}`);
        }
        catch (err) {
        }
    }
    else {
        // on linux and OS X we kill all direct and indirect child processes as well
        try {
            const cmd = path.join(__dirname, '../../../scripts/terminateProcess.sh');
            cp.spawnSync(cmd, [processId.toString()]);
        }
        catch (err) {
        }
    }
}
exports.killTree = killTree;
function makeMemoizedByteOffsetConverter(buffer) {
    let defaultValue = new avlTree_1.Node(0, 0); // 0 bytes will always be 0 characters
    let memo = new avlTree_1.NearestNeighborDict(defaultValue, avlTree_1.NearestNeighborDict.NUMERIC_DISTANCE_FUNCTION);
    return (byteOffset) => {
        let nearest = memo.getNearest(byteOffset);
        let byteDelta = byteOffset - nearest.key;
        if (byteDelta === 0)
            return nearest.value;
        let charDelta;
        if (byteDelta > 0)
            charDelta = buffer.toString('utf8', nearest.key, byteOffset).length;
        else
            charDelta = -buffer.toString('utf8', byteOffset, nearest.key).length;
        memo.insert(byteOffset, nearest.value + charDelta);
        return nearest.value + charDelta;
    };
}
exports.makeMemoizedByteOffsetConverter = makeMemoizedByteOffsetConverter;
function rmdirRecursive(dir) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
            const relPath = path.join(dir, file);
            if (fs.lstatSync(relPath).isDirectory()) {
                rmdirRecursive(dir);
            }
            else {
                fs.unlinkSync(relPath);
            }
        });
        fs.rmdirSync(dir);
    }
}
let tmpDir;
/**
 * Returns file path for given name in temp dir
 * @param name Name of the file
 */
function getTempFilePath(name) {
    if (!tmpDir) {
        tmpDir = fs.mkdtempSync(os.tmpdir() + path.sep + 'vscode-go');
    }
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
    }
    return path.normalize(path.join(tmpDir, name));
}
exports.getTempFilePath = getTempFilePath;
function cleanupTempDir() {
    if (!tmpDir) {
        rmdirRecursive(tmpDir);
    }
    tmpDir = undefined;
}
exports.cleanupTempDir = cleanupTempDir;
/**
 * Runs `go doc` to get documentation for given symbol
 * @param packagePath Either the absolute path or import path of the package.
 * @param symbol Symbol for which docs need to be found
 * @param token Cancellation token
 */
function runGodoc(packagePath, symbol, token) {
    if (!packagePath) {
        return Promise.reject(new Error('Package Path not provided'));
    }
    if (!symbol) {
        return Promise.reject(new Error('Symbol not provided'));
    }
    const goRuntimePath = getBinPath('go');
    if (!goRuntimePath) {
        return Promise.reject(new Error('Cannot find "go" binary. Update PATH or GOROOT appropriately'));
    }
    const getCurrentPackagePromise = path.isAbsolute(packagePath) ? goModules_1.getCurrentPackage(packagePath) : Promise.resolve(packagePath);
    return getCurrentPackagePromise.then(packageImportPath => {
        return new Promise((resolve, reject) => {
            const env = getToolsEnvVars();
            const args = ['doc', '-c', '-cmd', '-u', packageImportPath, symbol];
            const p = cp.execFile(goRuntimePath, args, { env }, (err, stdout, stderr) => {
                if (err) {
                    return reject(err.message || stderr);
                }
                const godocLines = stdout.split('\n');
                // Skip trailing empty lines
                let lastLine = godocLines.length - 1;
                for (; lastLine > 1; lastLine--) {
                    if (godocLines[lastLine].trim()) {
                        break;
                    }
                }
                let doc = '';
                for (let i = 1; i <= lastLine; i++) {
                    if (godocLines[i].startsWith('    ')) {
                        doc += godocLines[i].substring(4) + '\n';
                    }
                    else if (!godocLines[i].trim()) {
                        doc += '\n';
                    }
                }
                return resolve(doc);
            });
            if (token) {
                token.onCancellationRequested(() => {
                    killTree(p.pid);
                });
            }
        });
    });
}
exports.runGodoc = runGodoc;
//# sourceMappingURL=util.js.map