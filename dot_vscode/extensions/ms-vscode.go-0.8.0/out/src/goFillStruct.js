/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util_1 = require("./util");
const cp = require("child_process");
const goInstallTools_1 = require("./goInstallTools");
function runFillStruct(editor) {
    let args = getCommonArgs(editor);
    if (!args) {
        return Promise.reject('No args');
    }
    return execFillStruct(editor, args);
}
exports.runFillStruct = runFillStruct;
function getCommonArgs(editor) {
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('.go')) {
        vscode.window.showInformationMessage('Current file is not a Go file.');
        return;
    }
    let args = ['-modified', '-file', editor.document.fileName];
    if (editor.selection.isEmpty) {
        let offset = util_1.byteOffsetAt(editor.document, editor.selection.start);
        args.push('-offset');
        args.push(offset.toString());
    }
    else {
        args.push('-line');
        args.push(`${editor.selection.start.line + 1}`);
    }
    return args;
}
function getTabsCount(editor) {
    let startline = editor.selection.start.line;
    let tabs = editor.document.lineAt(startline).text.match('^\t*');
    return tabs.length;
}
function execFillStruct(editor, args) {
    let fillstruct = util_1.getBinPath('fillstruct');
    let input = util_1.getFileArchive(editor.document);
    let tabsCount = getTabsCount(editor);
    return new Promise((resolve, reject) => {
        let p = cp.execFile(fillstruct, args, { env: util_1.getToolsEnvVars() }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('fillstruct');
                    return reject();
                }
                if (err) {
                    vscode.window.showInformationMessage(`Cannot fill struct: ${stderr}`);
                    return reject();
                }
                let output = JSON.parse(stdout);
                if (output.length === 0) {
                    vscode.window.showInformationMessage(`Got empty fillstruct output`);
                    return reject();
                }
                let indent = '\t'.repeat(tabsCount);
                editor.edit(editBuilder => {
                    output.forEach((structToFill) => {
                        const out = structToFill.code.replace(/\n/g, '\n' + indent);
                        const rangeToReplace = new vscode.Range(editor.document.positionAt(structToFill.start), editor.document.positionAt(structToFill.end));
                        editBuilder.replace(rangeToReplace, out);
                    });
                }).then(() => resolve());
            }
            catch (e) {
                reject(e);
            }
        });
        if (p.pid) {
            p.stdin.end(input);
        }
    });
}
//# sourceMappingURL=goFillStruct.js.map