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
const goModules_1 = require("./goModules");
const missingToolMsg = 'Missing tool: ';
function definitionLocation(document, position, goConfig, includeDocs, token) {
    let adjustedPos = adjustWordPosition(document, position);
    if (!adjustedPos[0]) {
        return Promise.resolve(null);
    }
    let word = adjustedPos[1];
    position = adjustedPos[2];
    if (!goConfig) {
        goConfig = vscode.workspace.getConfiguration('go', document.uri);
    }
    let toolForDocs = goConfig['docsTool'] || 'godoc';
    return util_2.getGoVersion().then((ver) => {
        return goModules_1.isModSupported(document.uri).then(isMod => {
            const input = {
                document,
                position,
                word,
                includeDocs,
                isMod
            };
            if (toolForDocs === 'godoc' || (ver && (ver.major < 1 || (ver.major === 1 && ver.minor < 6)))) {
                return definitionLocation_godef(input, token);
            }
            else if (toolForDocs === 'guru') {
                return definitionLocation_guru(input, token);
            }
            return definitionLocation_gogetdoc(input, token, true);
        });
    });
}
exports.definitionLocation = definitionLocation;
function adjustWordPosition(document, position) {
    let wordRange = document.getWordRangeAtPosition(position);
    let lineText = document.lineAt(position.line).text;
    let word = wordRange ? document.getText(wordRange) : '';
    if (!wordRange || lineText.startsWith('//') || util_2.isPositionInString(document, position) || word.match(/^\d+.?\d+$/) || util_2.goKeywords.indexOf(word) > 0) {
        return [false, null, null];
    }
    if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
        position = position.translate(0, -1);
    }
    return [true, word, position];
}
exports.adjustWordPosition = adjustWordPosition;
const godefImportDefinitionRegex = /^import \(.* ".*"\)$/;
function definitionLocation_godef(input, token) {
    let godefTool = input.isMod ? 'godef-gomod' : 'godef';
    let godefPath = util_1.getBinPath(godefTool);
    if (!path.isAbsolute(godefPath)) {
        return Promise.reject(missingToolMsg + godefTool);
    }
    let offset = util_1.byteOffsetAt(input.document, input.position);
    let env = util_2.getToolsEnvVars();
    let p;
    if (token) {
        token.onCancellationRequested(() => util_2.killProcess(p));
    }
    const cwd = util_1.getWorkspaceFolderPath(input.document.uri);
    return new Promise((resolve, reject) => {
        // Spawn `godef` process
        p = cp.execFile(godefPath, ['-t', '-i', '-f', input.document.fileName, '-o', offset.toString()], { env, cwd }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    return reject(missingToolMsg + godefTool);
                }
                if (err) {
                    return reject(err.message || stderr);
                }
                let result = stdout.toString();
                let lines = result.split('\n');
                let match = /(.*):(\d+):(\d+)/.exec(lines[0]);
                if (!match) {
                    // TODO: Gotodef on pkg name:
                    // /usr/local/go/src/html/template\n
                    return resolve(null);
                }
                let [_, file, line, col] = match;
                let pkgPath = path.dirname(file);
                let definitionInformation = {
                    file: file,
                    line: +line - 1,
                    column: +col - 1,
                    declarationlines: lines.splice(1),
                    toolUsed: 'godef',
                    doc: null,
                    name: null
                };
                if (!input.includeDocs || godefImportDefinitionRegex.test(definitionInformation.declarationlines[0])) {
                    return resolve(definitionInformation);
                }
                util_1.runGodoc(pkgPath, input.word, token).then(doc => {
                    if (doc) {
                        definitionInformation.doc = doc;
                    }
                    resolve(definitionInformation);
                }).catch(err => {
                    console.log(err);
                    resolve(definitionInformation);
                });
            }
            catch (e) {
                reject(e);
            }
        });
        if (p.pid) {
            p.stdin.end(input.document.getText());
        }
    });
}
function definitionLocation_gogetdoc(input, token, useTags) {
    let gogetdoc = util_1.getBinPath('gogetdoc');
    if (!path.isAbsolute(gogetdoc)) {
        return Promise.reject(missingToolMsg + 'gogetdoc');
    }
    let offset = util_1.byteOffsetAt(input.document, input.position);
    let env = util_2.getToolsEnvVars();
    let p;
    if (token) {
        token.onCancellationRequested(() => util_2.killProcess(p));
    }
    return new Promise((resolve, reject) => {
        let gogetdocFlagsWithoutTags = ['-u', '-json', '-modified', '-pos', input.document.fileName + ':#' + offset.toString()];
        let buildTags = vscode.workspace.getConfiguration('go', input.document.uri)['buildTags'];
        let gogetdocFlags = (buildTags && useTags) ? [...gogetdocFlagsWithoutTags, '-tags', buildTags] : gogetdocFlagsWithoutTags;
        p = cp.execFile(gogetdoc, gogetdocFlags, { env }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    return reject(missingToolMsg + 'gogetdoc');
                }
                if (stderr && stderr.startsWith('flag provided but not defined: -tags')) {
                    p = null;
                    return definitionLocation_gogetdoc(input, token, false);
                }
                if (err) {
                    if (input.isMod
                        && !input.includeDocs
                        && stdout.startsWith(`gogetdoc: couldn't get package for`)) {
                        goModules_1.promptToUpdateToolForModules('gogetdoc', `To get the Go to Definition feature when using Go modules, please update your version of the "gogetdoc" tool.`);
                        return resolve(null);
                    }
                    return reject(err.message || stderr);
                }
                let goGetDocOutput = JSON.parse(stdout.toString());
                let match = /(.*):(\d+):(\d+)/.exec(goGetDocOutput.pos);
                let definitionInfo = {
                    file: null,
                    line: 0,
                    column: 0,
                    toolUsed: 'gogetdoc',
                    declarationlines: goGetDocOutput.decl.split('\n'),
                    doc: goGetDocOutput.doc,
                    name: goGetDocOutput.name
                };
                if (!match) {
                    return resolve(definitionInfo);
                }
                let [_, file, line, col] = match;
                definitionInfo.file = match[1];
                definitionInfo.line = +match[2] - 1;
                definitionInfo.column = +match[3] - 1;
                return resolve(definitionInfo);
            }
            catch (e) {
                reject(e);
            }
        });
        if (p.pid) {
            p.stdin.end(util_2.getFileArchive(input.document));
        }
    });
}
function definitionLocation_guru(input, token) {
    let guru = util_1.getBinPath('guru');
    if (!path.isAbsolute(guru)) {
        return Promise.reject(missingToolMsg + 'guru');
    }
    let offset = util_1.byteOffsetAt(input.document, input.position);
    let env = util_2.getToolsEnvVars();
    let p;
    if (token) {
        token.onCancellationRequested(() => util_2.killProcess(p));
    }
    return new Promise((resolve, reject) => {
        p = cp.execFile(guru, ['-json', '-modified', 'definition', input.document.fileName + ':#' + offset.toString()], { env }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    return reject(missingToolMsg + 'guru');
                }
                if (err) {
                    return reject(err.message || stderr);
                }
                let guruOutput = JSON.parse(stdout.toString());
                let match = /(.*):(\d+):(\d+)/.exec(guruOutput.objpos);
                let definitionInfo = {
                    file: null,
                    line: 0,
                    column: 0,
                    toolUsed: 'guru',
                    declarationlines: [guruOutput.desc],
                    doc: null,
                    name: null,
                };
                if (!match) {
                    return resolve(definitionInfo);
                }
                let [_, file, line, col] = match;
                definitionInfo.file = match[1];
                definitionInfo.line = +match[2] - 1;
                definitionInfo.column = +match[3] - 1;
                return resolve(definitionInfo);
            }
            catch (e) {
                reject(e);
            }
        });
        if (p.pid) {
            p.stdin.end(util_2.getFileArchive(input.document));
        }
    });
}
function parseMissingError(err) {
    if (err) {
        // Prompt for missing tool is located here so that the
        // prompts dont show up on hover or signature help
        if (typeof err === 'string' && err.startsWith(missingToolMsg)) {
            return [true, err.substr(missingToolMsg.length)];
        }
    }
    return [false, null];
}
exports.parseMissingError = parseMissingError;
class GoDefinitionProvider {
    constructor(goConfig) {
        this.goConfig = null;
        this.goConfig = goConfig;
    }
    provideDefinition(document, position, token) {
        return definitionLocation(document, position, this.goConfig, false, token).then(definitionInfo => {
            if (definitionInfo == null || definitionInfo.file == null)
                return null;
            let definitionResource = vscode.Uri.file(definitionInfo.file);
            let pos = new vscode.Position(definitionInfo.line, definitionInfo.column);
            return new vscode.Location(definitionResource, pos);
        }, err => {
            let miss = parseMissingError(err);
            if (miss[0]) {
                goInstallTools_1.promptForMissingTool(miss[1]);
            }
            else if (err) {
                return Promise.reject(err);
            }
            return Promise.resolve(null);
        });
    }
}
exports.GoDefinitionProvider = GoDefinitionProvider;
//# sourceMappingURL=goDeclaration.js.map