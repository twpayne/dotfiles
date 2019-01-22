/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util_1 = require("./util");
const cp = require("child_process");
const goInstallTools_1 = require("./goInstallTools");
function addTags(commandArgs) {
    let args = getCommonArgs();
    if (!args) {
        return;
    }
    getTagsAndOptions(vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor.document.uri)['addTags'], commandArgs).then(([tags, options, transformValue]) => {
        if (!tags && !options) {
            return;
        }
        if (tags) {
            args.push('--add-tags');
            args.push(tags);
        }
        if (options) {
            args.push('--add-options');
            args.push(options);
        }
        if (transformValue) {
            args.push('--transform');
            args.push(transformValue);
        }
        runGomodifytags(args);
    });
}
exports.addTags = addTags;
function removeTags(commandArgs) {
    let args = getCommonArgs();
    if (!args) {
        return;
    }
    getTagsAndOptions(vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor.document.uri)['removeTags'], commandArgs).then(([tags, options]) => {
        if (!tags && !options) {
            args.push('--clear-tags');
            args.push('--clear-options');
        }
        if (tags) {
            args.push('--remove-tags');
            args.push(tags);
        }
        if (options) {
            args.push('--remove-options');
            args.push(options);
        }
        runGomodifytags(args);
    });
}
exports.removeTags = removeTags;
function getCommonArgs() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('.go')) {
        vscode.window.showInformationMessage('Current file is not a Go file.');
        return;
    }
    let args = ['-modified', '-file', editor.document.fileName, '-format', 'json'];
    if (editor.selection.start.line === editor.selection.end.line && editor.selection.start.character === editor.selection.end.character) {
        // Add tags to the whole struct
        let offset = util_1.byteOffsetAt(editor.document, editor.selection.start);
        args.push('-offset');
        args.push(offset.toString());
    }
    else if (editor.selection.start.line <= editor.selection.end.line) {
        // Add tags to selected lines
        args.push('-line');
        args.push(`${editor.selection.start.line + 1},${editor.selection.end.line + 1}`);
    }
    return args;
}
function getTagsAndOptions(config, commandArgs) {
    let tags = commandArgs && commandArgs.hasOwnProperty('tags') ? commandArgs['tags'] : config['tags'];
    let options = commandArgs && commandArgs.hasOwnProperty('options') ? commandArgs['options'] : config['options'];
    let promptForTags = commandArgs && commandArgs.hasOwnProperty('promptForTags') ? commandArgs['promptForTags'] : config['promptForTags'];
    let transformValue = commandArgs && commandArgs.hasOwnProperty('transform') ? commandArgs['transform'] : config['transform'];
    if (!promptForTags) {
        return Promise.resolve([tags, options, transformValue]);
    }
    return vscode.window.showInputBox({
        value: 'json',
        prompt: 'Enter comma separated tag names'
    }).then(inputTags => {
        return vscode.window.showInputBox({
            value: 'json=omitempty,xml=cdata',
            prompt: 'Enter comma separated options'
        }).then(inputOptions => {
            return [inputTags, inputOptions, transformValue];
        });
    });
}
function runGomodifytags(args) {
    let gomodifytags = util_1.getBinPath('gomodifytags');
    let editor = vscode.window.activeTextEditor;
    let input = util_1.getFileArchive(editor.document);
    let p = cp.execFile(gomodifytags, args, { env: util_1.getToolsEnvVars() }, (err, stdout, stderr) => {
        if (err && err.code === 'ENOENT') {
            goInstallTools_1.promptForMissingTool('gomodifytags');
            return;
        }
        if (err) {
            vscode.window.showInformationMessage(`Cannot modify tags: ${stderr}`);
            return;
        }
        let output = JSON.parse(stdout);
        vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.replace(new vscode.Range(output.start - 1, 0, output.end, 0), output.lines.join('\n') + '\n');
        });
    });
    if (p.pid) {
        p.stdin.end(input);
    }
}
//# sourceMappingURL=goModifytags.js.map