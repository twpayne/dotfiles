/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
const diffUtils_1 = require("./diffUtils");
const goInstallTools_1 = require("./goInstallTools");
const goStatus_1 = require("./goStatus");
class GoRenameProvider {
    provideRenameEdits(document, position, newName, token) {
        return vscode.workspace.saveAll(false).then(() => {
            return this.doRename(document, position, newName, token);
        });
    }
    doRename(document, position, newName, token) {
        return new Promise((resolve, reject) => {
            let filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
            let range = document.getWordRangeAtPosition(position);
            let pos = range ? range.start : position;
            let offset = util_1.byteOffsetAt(document, pos);
            let env = util_1.getToolsEnvVars();
            let gorename = util_1.getBinPath('gorename');
            const buildTags = vscode.workspace.getConfiguration('go', document.uri)['buildTags'];
            let gorenameArgs = ['-offset', filename + ':#' + offset, '-to', newName];
            if (buildTags) {
                gorenameArgs.push('-tags', buildTags);
            }
            let canRenameToolUseDiff = diffUtils_1.isDiffToolAvailable();
            if (canRenameToolUseDiff) {
                gorenameArgs.push('-d');
            }
            let p;
            if (token) {
                token.onCancellationRequested(() => util_1.killProcess(p));
            }
            p = cp.execFile(gorename, gorenameArgs, { env }, (err, stdout, stderr) => {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('gorename');
                        return resolve(null);
                    }
                    if (err) {
                        let errMsg = stderr ? 'Rename failed: ' + stderr.replace(/\n/g, ' ') : 'Rename failed';
                        console.log(errMsg);
                        goStatus_1.outputChannel.appendLine(errMsg);
                        goStatus_1.outputChannel.show();
                        return reject();
                    }
                    let result = new vscode.WorkspaceEdit();
                    if (canRenameToolUseDiff) {
                        let filePatches = diffUtils_1.getEditsFromUnifiedDiffStr(stdout);
                        filePatches.forEach((filePatch) => {
                            let fileUri = vscode.Uri.file(filePatch.fileName);
                            filePatch.edits.forEach((edit) => {
                                edit.applyUsingWorkspaceEdit(result, fileUri);
                            });
                        });
                    }
                    return resolve(result);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
}
exports.GoRenameProvider = GoRenameProvider;
//# sourceMappingURL=goRename.js.map