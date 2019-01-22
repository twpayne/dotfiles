/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
class GoWorkspaceSymbolProvider {
    constructor() {
        this.goKindToCodeKind = {
            'package': vscode.SymbolKind.Package,
            'import': vscode.SymbolKind.Namespace,
            'var': vscode.SymbolKind.Variable,
            'type': vscode.SymbolKind.Interface,
            'func': vscode.SymbolKind.Function,
            'const': vscode.SymbolKind.Constant,
        };
    }
    provideWorkspaceSymbols(query, token) {
        let convertToCodeSymbols = (decls, symbols) => {
            decls.forEach(decl => {
                let kind;
                if (decl.kind !== '') {
                    kind = this.goKindToCodeKind[decl.kind];
                }
                let pos = new vscode.Position(decl.line, decl.character);
                let symbolInfo = new vscode.SymbolInformation(decl.name, kind, new vscode.Range(pos, pos), vscode.Uri.file(decl.path), '');
                symbols.push(symbolInfo);
            });
        };
        let root = vscode.workspace.rootPath;
        if (vscode.window.activeTextEditor && vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)) {
            root = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri.fsPath;
        }
        let goConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
        if (!root && !goConfig.gotoSymbol.includeGoroot) {
            vscode.window.showInformationMessage('No workspace is open to find symbols.');
            return;
        }
        return getWorkspaceSymbols(root, query, token, goConfig).then(results => {
            let symbols = [];
            convertToCodeSymbols(results, symbols);
            return symbols;
        });
    }
}
exports.GoWorkspaceSymbolProvider = GoWorkspaceSymbolProvider;
function getWorkspaceSymbols(workspacePath, query, token, goConfig, ignoreFolderFeatureOn = true) {
    if (!goConfig) {
        goConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
    }
    let gotoSymbolConfig = goConfig['gotoSymbol'];
    let calls = [];
    let ignoreFolders = gotoSymbolConfig ? gotoSymbolConfig['ignoreFolders'] : [];
    let baseArgs = (ignoreFolderFeatureOn && ignoreFolders && ignoreFolders.length > 0) ? ['-ignore', ignoreFolders.join(',')] : [];
    calls.push(callGoSymbols([...baseArgs, workspacePath, query], token));
    if (gotoSymbolConfig.includeGoroot) {
        let gorootCall = getGoroot()
            .then(goRoot => callGoSymbols([...baseArgs, goRoot, query], token));
        calls.push(gorootCall);
    }
    return Promise.all(calls)
        .then(([...results]) => [].concat(...results))
        .catch((err) => {
        if (err && err.code === 'ENOENT') {
            goInstallTools_1.promptForMissingTool('go-symbols');
        }
        if (err.message.startsWith('flag provided but not defined: -ignore')) {
            goInstallTools_1.promptForUpdatingTool('go-symbols');
            return getWorkspaceSymbols(workspacePath, query, token, goConfig, false);
        }
    });
}
exports.getWorkspaceSymbols = getWorkspaceSymbols;
function callGoSymbols(args, token) {
    let gosyms = util_1.getBinPath('go-symbols');
    let env = util_1.getToolsEnvVars();
    let p;
    if (token) {
        token.onCancellationRequested(() => util_1.killProcess(p));
    }
    return new Promise((resolve, reject) => {
        p = cp.execFile(gosyms, args, { maxBuffer: 1024 * 1024, env }, (err, stdout, stderr) => {
            if (err && stderr && stderr.startsWith('flag provided but not defined: -ignore')) {
                return reject(new Error(stderr));
            }
            else if (err) {
                return reject(err);
            }
            let result = stdout.toString();
            let decls = JSON.parse(result);
            return resolve(decls);
        });
    });
}
function getGoroot() {
    let goExecutable = util_1.getBinPath('go');
    if (!goExecutable) {
        return Promise.reject(new Error('Cannot find "go" binary. Update PATH or GOROOT appropriately'));
    }
    return new Promise((resolve, reject) => {
        cp.execFile(goExecutable, ['env', 'GOROOT'], (err, stdout) => {
            if (err) {
                reject(err);
                return;
            }
            let [goRoot] = stdout.split('\n');
            resolve(goRoot.trim());
        });
    });
}
//# sourceMappingURL=goSymbol.js.map