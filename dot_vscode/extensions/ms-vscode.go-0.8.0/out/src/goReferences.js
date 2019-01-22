/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
class GoReferenceProvider {
    provideReferences(document, position, options, token) {
        return this.doFindReferences(document, position, options, token);
    }
    doFindReferences(document, position, options, token) {
        return new Promise((resolve, reject) => {
            // get current word
            let wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return resolve([]);
            }
            let goGuru = util_1.getBinPath('guru');
            if (!path.isAbsolute(goGuru)) {
                goInstallTools_1.promptForMissingTool('guru');
                return reject('Cannot find tool "guru" to find references.');
            }
            let filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
            let cwd = path.dirname(filename);
            let offset = util_1.byteOffsetAt(document, position);
            let env = util_1.getToolsEnvVars();
            let buildTags = vscode.workspace.getConfiguration('go', document.uri)['buildTags'];
            let args = buildTags ? ['-tags', buildTags] : [];
            args.push('-modified', 'referrers', `${filename}:#${offset.toString()}`);
            let process = cp.execFile(goGuru, args, { env }, (err, stdout, stderr) => {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('guru');
                        return reject('Cannot find tool "guru" to find references.');
                    }
                    if (err && err.killed !== true) {
                        return reject(`Error running guru: ${err.message || stderr}`);
                    }
                    let lines = stdout.toString().split('\n');
                    let results = [];
                    for (let i = 0; i < lines.length; i++) {
                        let match = /^(.*):(\d+)\.(\d+)-(\d+)\.(\d+):/.exec(lines[i]);
                        if (!match)
                            continue;
                        let [_, file, lineStartStr, colStartStr, lineEndStr, colEndStr] = match;
                        let referenceResource = vscode.Uri.file(path.resolve(cwd, file));
                        if (!options.includeDeclaration) {
                            if (document.uri.fsPath === referenceResource.fsPath &&
                                position.line === Number(lineStartStr) - 1) {
                                continue;
                            }
                        }
                        let range = new vscode.Range(+lineStartStr - 1, +colStartStr - 1, +lineEndStr - 1, +colEndStr);
                        results.push(new vscode.Location(referenceResource, range));
                    }
                    resolve(results);
                }
                catch (e) {
                    reject(e);
                }
            });
            if (process.pid) {
                process.stdin.end(util_1.getFileArchive(document));
            }
            token.onCancellationRequested(() => util_1.killTree(process.pid));
        });
    }
}
exports.GoReferenceProvider = GoReferenceProvider;
//# sourceMappingURL=goReferences.js.map