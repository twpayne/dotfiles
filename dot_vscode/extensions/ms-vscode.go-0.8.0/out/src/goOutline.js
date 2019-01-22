/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
var GoOutlineImportsOptions;
(function (GoOutlineImportsOptions) {
    GoOutlineImportsOptions[GoOutlineImportsOptions["Include"] = 0] = "Include";
    GoOutlineImportsOptions[GoOutlineImportsOptions["Exclude"] = 1] = "Exclude";
    GoOutlineImportsOptions[GoOutlineImportsOptions["Only"] = 2] = "Only";
})(GoOutlineImportsOptions = exports.GoOutlineImportsOptions || (exports.GoOutlineImportsOptions = {}));
function documentSymbols(options, token) {
    return runGoOutline(options, token).then(decls => {
        let symbols = [];
        convertToCodeSymbols(options.document, decls, symbols, '', options.importsOption !== GoOutlineImportsOptions.Exclude, (options.skipRanges || !options.document) ? null : util_1.makeMemoizedByteOffsetConverter(new Buffer(options.document.getText())));
        return symbols;
    });
}
exports.documentSymbols = documentSymbols;
function runGoOutline(options, token) {
    return new Promise((resolve, reject) => {
        let gooutline = util_1.getBinPath('go-outline');
        let gooutlineFlags = ['-f', options.fileName];
        if (options.importsOption === GoOutlineImportsOptions.Only) {
            gooutlineFlags.push('-imports-only');
        }
        if (options.document) {
            gooutlineFlags.push('-modified');
        }
        let p;
        if (token) {
            token.onCancellationRequested(() => util_1.killProcess(p));
        }
        // Spawn `go-outline` process
        p = cp.execFile(gooutline, gooutlineFlags, { env: util_1.getToolsEnvVars() }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('go-outline');
                }
                if (stderr && stderr.startsWith('flag provided but not defined: ')) {
                    goInstallTools_1.promptForUpdatingTool('go-outline');
                    if (stderr.startsWith('flag provided but not defined: -imports-only')) {
                        options.importsOption = GoOutlineImportsOptions.Include;
                    }
                    if (stderr.startsWith('flag provided but not defined: -modified')) {
                        options.document = null;
                    }
                    p = null;
                    return runGoOutline(options, token).then(results => {
                        return resolve(results);
                    });
                }
                if (err)
                    return resolve(null);
                let result = stdout.toString();
                let decls = JSON.parse(result);
                return resolve(decls);
            }
            catch (e) {
                reject(e);
            }
        });
        if (options.document && p.pid) {
            p.stdin.end(util_1.getFileArchive(options.document));
        }
    });
}
exports.runGoOutline = runGoOutline;
const goKindToCodeKind = {
    'package': vscode.SymbolKind.Package,
    'import': vscode.SymbolKind.Namespace,
    'variable': vscode.SymbolKind.Variable,
    'type': vscode.SymbolKind.Interface,
    'function': vscode.SymbolKind.Function,
    'struct': vscode.SymbolKind.Struct,
};
function convertToCodeSymbols(document, decls, symbols, containerName, includeImports, byteOffsetToDocumentOffset) {
    (decls || []).forEach(decl => {
        if (!includeImports && decl.type === 'import')
            return;
        let label = decl.label;
        if (label === '_' && decl.type === 'variable')
            return;
        if (decl.receiverType) {
            label = '(' + decl.receiverType + ').' + label;
        }
        let range = null;
        if (document && byteOffsetToDocumentOffset) {
            let start = byteOffsetToDocumentOffset(decl.start - 1);
            let end = byteOffsetToDocumentOffset(decl.end - 1);
            range = new vscode.Range(document.positionAt(start), document.positionAt(end));
            if (decl.type === 'type') {
                let line = document.lineAt(document.positionAt(start));
                let regex = new RegExp(`^\\s*type\\s+${decl.label}\\s+struct\\b`);
                decl.type = regex.test(line.text) ? 'struct' : 'type';
            }
        }
        let symbolInfo = new vscode.SymbolInformation(label, goKindToCodeKind[decl.type], range, document ? document.uri : null, containerName);
        symbols.push(symbolInfo);
        if (decl.children) {
            convertToCodeSymbols(document, decl.children, symbols, decl.label, includeImports, byteOffsetToDocumentOffset);
        }
    });
}
class GoDocumentSymbolProvider {
    constructor(includeImports) {
        this.includeImports = includeImports;
    }
    provideDocumentSymbols(document, token) {
        if (typeof this.includeImports !== 'boolean') {
            let gotoSymbolConfig = vscode.workspace.getConfiguration('go', document.uri)['gotoSymbol'];
            this.includeImports = gotoSymbolConfig ? gotoSymbolConfig['includeImports'] : false;
        }
        let options = { fileName: document.fileName, document: document, importsOption: this.includeImports ? GoOutlineImportsOptions.Include : GoOutlineImportsOptions.Exclude };
        return documentSymbols(options, token);
    }
}
exports.GoDocumentSymbolProvider = GoDocumentSymbolProvider;
//# sourceMappingURL=goOutline.js.map