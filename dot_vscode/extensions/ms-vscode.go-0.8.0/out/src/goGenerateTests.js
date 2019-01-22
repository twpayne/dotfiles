/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const path = require("path");
const vscode = require("vscode");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
const goOutline_1 = require("./goOutline");
const goStatus_1 = require("./goStatus");
const generatedWord = 'Generated ';
/**
 * If current active editor has a Go file, returns the editor.
 */
function checkActiveEditor() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Cannot generate unit tests. No editor selected.');
        return;
    }
    if (!editor.document.fileName.endsWith('.go')) {
        vscode.window.showInformationMessage('Cannot generate unit tests. File in the editor is not a Go file.');
        return;
    }
    if (editor.document.isDirty) {
        vscode.window.showInformationMessage('File has unsaved changes. Save and try again.');
        return;
    }
    return editor;
}
/**
 * Toggles between file in current active editor and the corresponding test file.
 */
function toggleTestFile() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Cannot toggle test file. No editor selected.');
        return;
    }
    let currentFilePath = editor.document.fileName;
    if (!currentFilePath.endsWith('.go')) {
        vscode.window.showInformationMessage('Cannot toggle test file. File in the editor is not a Go file.');
        return;
    }
    let targetFilePath = '';
    if (currentFilePath.endsWith('_test.go')) {
        targetFilePath = currentFilePath.substr(0, currentFilePath.lastIndexOf('_test.go')) + '.go';
    }
    else {
        targetFilePath = currentFilePath.substr(0, currentFilePath.lastIndexOf('.go')) + '_test.go';
    }
    for (let doc of vscode.window.visibleTextEditors) {
        if (doc.document.fileName === targetFilePath) {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(targetFilePath), doc.viewColumn);
            return;
        }
    }
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(targetFilePath));
}
exports.toggleTestFile = toggleTestFile;
function generateTestCurrentPackage() {
    let editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    return generateTests({ dir: path.dirname(editor.document.uri.fsPath) }, vscode.workspace.getConfiguration('go', editor.document.uri));
}
exports.generateTestCurrentPackage = generateTestCurrentPackage;
function generateTestCurrentFile() {
    let editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    return generateTests({ dir: editor.document.uri.fsPath }, vscode.workspace.getConfiguration('go', editor.document.uri));
}
exports.generateTestCurrentFile = generateTestCurrentFile;
function generateTestCurrentFunction() {
    let editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    return getFunctions(editor.document).then(functions => {
        let currentFunction;
        for (let func of functions) {
            let selection = editor.selection;
            if (selection && func.location.range.contains(selection.start)) {
                currentFunction = func;
                break;
            }
        }
        if (!currentFunction) {
            vscode.window.showInformationMessage('No function found at cursor.');
            return Promise.resolve(false);
        }
        let funcName = currentFunction.name;
        if (funcName.includes('.')) {
            funcName = funcName.split('.')[1];
        }
        return generateTests({ dir: editor.document.uri.fsPath, func: funcName }, vscode.workspace.getConfiguration('go', editor.document.uri));
    });
}
exports.generateTestCurrentFunction = generateTestCurrentFunction;
function generateTests(conf, goConfig) {
    return new Promise((resolve, reject) => {
        let cmd = util_1.getBinPath('gotests');
        let args = ['-w'];
        let goGenerateTestsFlags = goConfig['generateTestsFlags'] || [];
        for (let i = 0; i < goGenerateTestsFlags.length; i++) {
            const flag = goGenerateTestsFlags[i];
            if (flag === '-w' || flag === 'all') {
                continue;
            }
            if (flag === '-only') {
                i++;
                continue;
            }
            args.push(flag);
        }
        if (conf.func) {
            args = args.concat(['-only', `^${conf.func}$`, conf.dir]);
        }
        else {
            args = args.concat(['-all', conf.dir]);
        }
        cp.execFile(cmd, args, { env: util_1.getToolsEnvVars() }, (err, stdout, stderr) => {
            goStatus_1.outputChannel.appendLine('Generating Tests: ' + cmd + ' ' + args.join(' '));
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('gotests');
                    return resolve(false);
                }
                if (err) {
                    console.log(err);
                    goStatus_1.outputChannel.appendLine(err.message);
                    return reject('Cannot generate test due to errors');
                }
                let message = stdout;
                let testsGenerated = false;
                // Expected stdout is of the format "Generated TestMain\nGenerated Testhello\n"
                if (stdout.startsWith(generatedWord)) {
                    let lines = stdout.split('\n').filter(element => {
                        return element.startsWith(generatedWord);
                    }).map((element) => {
                        return element.substr(generatedWord.length);
                    });
                    message = `Generated ${lines.join(', ')}`;
                    testsGenerated = true;
                }
                vscode.window.showInformationMessage(message);
                goStatus_1.outputChannel.append(message);
                if (testsGenerated) {
                    toggleTestFile();
                }
                return resolve(true);
            }
            catch (e) {
                vscode.window.showInformationMessage(e.msg);
                goStatus_1.outputChannel.append(e.msg);
                reject(e);
            }
        });
    });
}
function getFunctions(doc) {
    let documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
    return documentSymbolProvider
        .provideDocumentSymbols(doc, null)
        .then(symbols => symbols.filter(sym => sym.kind === vscode.SymbolKind.Function));
}
//# sourceMappingURL=goGenerateTests.js.map