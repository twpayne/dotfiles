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
const util_2 = require("./util");
const goDeclaration_1 = require("./goDeclaration");
class GoTypeDefinitionProvider {
    provideTypeDefinition(document, position, token) {
        let adjustedPos = goDeclaration_1.adjustWordPosition(document, position);
        if (!adjustedPos[0]) {
            return Promise.resolve(null);
        }
        position = adjustedPos[2];
        return new Promise((resolve, reject) => {
            let goGuru = util_1.getBinPath('guru');
            if (!path.isAbsolute(goGuru)) {
                goInstallTools_1.promptForMissingTool('guru');
                return reject('Cannot find tool "guru" to find type definitions.');
            }
            let filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
            let offset = util_1.byteOffsetAt(document, position);
            let env = util_2.getToolsEnvVars();
            let buildTags = vscode.workspace.getConfiguration('go', document.uri)['buildTags'];
            let args = buildTags ? ['-tags', buildTags] : [];
            args.push('-json', '-modified', 'describe', `${filename}:#${offset.toString()}`);
            let process = cp.execFile(goGuru, args, { env }, (err, stdout, stderr) => {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('guru');
                        return resolve(null);
                    }
                    if (err) {
                        return reject(err);
                    }
                    let guruOutput = JSON.parse(stdout.toString());
                    if (!guruOutput.value || !guruOutput.value.typespos) {
                        if (guruOutput.value
                            && guruOutput.value.type
                            && !util_1.goBuiltinTypes.has(guruOutput.value.type)
                            && guruOutput.value.type !== 'invalid type') {
                            console.log('no typespos from guru\'s output - try to update guru tool');
                        }
                        // Fall back to position of declaration
                        return goDeclaration_1.definitionLocation(document, position, null, false, token).then(definitionInfo => {
                            if (definitionInfo == null || definitionInfo.file == null)
                                return null;
                            let definitionResource = vscode.Uri.file(definitionInfo.file);
                            let pos = new vscode.Position(definitionInfo.line, definitionInfo.column);
                            resolve(new vscode.Location(definitionResource, pos));
                        }, err => {
                            let miss = goDeclaration_1.parseMissingError(err);
                            if (miss[0]) {
                                goInstallTools_1.promptForMissingTool(miss[1]);
                            }
                            else if (err) {
                                return Promise.reject(err);
                            }
                            return Promise.resolve(null);
                        });
                    }
                    let results = [];
                    guruOutput.value.typespos.forEach(ref => {
                        let match = /^(.*):(\d+):(\d+)/.exec(ref.objpos);
                        if (!match) {
                            return;
                        }
                        let [_, file, line, col] = match;
                        let referenceResource = vscode.Uri.file(file);
                        let pos = new vscode.Position(parseInt(line) - 1, parseInt(col) - 1);
                        results.push(new vscode.Location(referenceResource, pos));
                    });
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
exports.GoTypeDefinitionProvider = GoTypeDefinitionProvider;
//# sourceMappingURL=goTypeDefinition.js.map