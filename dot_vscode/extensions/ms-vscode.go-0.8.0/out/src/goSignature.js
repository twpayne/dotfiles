/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_1 = require("vscode");
const goDeclaration_1 = require("./goDeclaration");
const util_1 = require("./util");
class GoSignatureHelpProvider {
    constructor(goConfig) {
        this.goConfig = null;
        this.goConfig = goConfig;
    }
    provideSignatureHelp(document, position, token) {
        if (!this.goConfig) {
            this.goConfig = vscode.workspace.getConfiguration('go', document.uri);
        }
        let theCall = this.walkBackwardsToBeginningOfCall(document, position);
        if (theCall == null) {
            return Promise.resolve(null);
        }
        let callerPos = this.previousTokenPosition(document, theCall.openParen);
        // Temporary fix to fall back to godoc if guru is the set docsTool
        let goConfig = this.goConfig;
        if (goConfig['docsTool'] === 'guru') {
            goConfig = Object.assign({}, goConfig, { 'docsTool': 'godoc' });
        }
        return goDeclaration_1.definitionLocation(document, callerPos, goConfig, true, token).then(res => {
            if (!res) {
                // The definition was not found
                return null;
            }
            if (res.line === callerPos.line) {
                // This must be a function definition
                return null;
            }
            let declarationText = (res.declarationlines || []).join(' ').trim();
            if (!declarationText) {
                return null;
            }
            let result = new vscode_1.SignatureHelp();
            let sig;
            let si;
            if (res.toolUsed === 'godef') {
                // declaration is of the form "Add func(a int, b int) int"
                let nameEnd = declarationText.indexOf(' ');
                let sigStart = nameEnd + 5; // ' func'
                let funcName = declarationText.substring(0, nameEnd);
                sig = declarationText.substring(sigStart);
                si = new vscode_1.SignatureInformation(funcName + sig, res.doc);
            }
            else if (res.toolUsed === 'gogetdoc') {
                // declaration is of the form "func Add(a int, b int) int"
                declarationText = declarationText.substring(5);
                let funcNameStart = declarationText.indexOf(res.name + '('); // Find 'functionname(' to remove anything before it
                if (funcNameStart > 0) {
                    declarationText = declarationText.substring(funcNameStart);
                }
                si = new vscode_1.SignatureInformation(declarationText, res.doc);
                sig = declarationText.substring(res.name.length);
            }
            si.parameters = util_1.getParametersAndReturnType(sig).params.map(paramText => new vscode_1.ParameterInformation(paramText));
            result.signatures = [si];
            result.activeSignature = 0;
            result.activeParameter = Math.min(theCall.commas.length, si.parameters.length - 1);
            return result;
        }, () => {
            return null;
        });
    }
    previousTokenPosition(document, position) {
        while (position.character > 0) {
            let word = document.getWordRangeAtPosition(position);
            if (word) {
                return word.start;
            }
            position = position.translate(0, -1);
        }
        return null;
    }
    walkBackwardsToBeginningOfCall(document, position) {
        let parenBalance = 0;
        let commas = [];
        let maxLookupLines = 30;
        for (let line = position.line; line >= 0 && maxLookupLines >= 0; line--, maxLookupLines--) {
            let currentLine = document.lineAt(line).text;
            let characterPosition = document.lineAt(line).text.length - 1;
            if (line === position.line) {
                characterPosition = position.character;
                currentLine = currentLine.substring(0, position.character);
            }
            for (let char = characterPosition; char >= 0; char--) {
                switch (currentLine[char]) {
                    case '(':
                        parenBalance--;
                        if (parenBalance < 0) {
                            return {
                                openParen: new vscode_1.Position(line, char),
                                commas: commas
                            };
                        }
                        break;
                    case ')':
                        parenBalance++;
                        break;
                    case ',':
                        if (parenBalance === 0) {
                            commas.push(new vscode_1.Position(line, char));
                        }
                }
            }
        }
        return null;
    }
}
exports.GoSignatureHelpProvider = GoSignatureHelpProvider;
//# sourceMappingURL=goSignature.js.map