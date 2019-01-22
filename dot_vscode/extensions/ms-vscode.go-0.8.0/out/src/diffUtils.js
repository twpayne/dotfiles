"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const goPath_1 = require("./goPath");
const jsDiff = require("diff");
let diffToolAvailable = null;
function isDiffToolAvailable() {
    if (diffToolAvailable == null) {
        const envPath = process.env['PATH'] || (process.platform === 'win32' ? process.env['Path'] : null);
        diffToolAvailable = goPath_1.getBinPathFromEnvVar('diff', envPath, false) != null;
    }
    return diffToolAvailable;
}
exports.isDiffToolAvailable = isDiffToolAvailable;
var EditTypes;
(function (EditTypes) {
    EditTypes[EditTypes["EDIT_DELETE"] = 0] = "EDIT_DELETE";
    EditTypes[EditTypes["EDIT_INSERT"] = 1] = "EDIT_INSERT";
    EditTypes[EditTypes["EDIT_REPLACE"] = 2] = "EDIT_REPLACE";
})(EditTypes = exports.EditTypes || (exports.EditTypes = {}));
class Edit {
    constructor(action, start) {
        this.action = action;
        this.start = start;
        this.text = '';
    }
    // Creates TextEdit for current Edit
    apply() {
        switch (this.action) {
            case EditTypes.EDIT_INSERT:
                return vscode_1.TextEdit.insert(this.start, this.text);
            case EditTypes.EDIT_DELETE:
                return vscode_1.TextEdit.delete(new vscode_1.Range(this.start, this.end));
            case EditTypes.EDIT_REPLACE:
                return vscode_1.TextEdit.replace(new vscode_1.Range(this.start, this.end), this.text);
        }
    }
    // Applies Edit using given TextEditorEdit
    applyUsingTextEditorEdit(editBuilder) {
        switch (this.action) {
            case EditTypes.EDIT_INSERT:
                editBuilder.insert(this.start, this.text);
                break;
            case EditTypes.EDIT_DELETE:
                editBuilder.delete(new vscode_1.Range(this.start, this.end));
                break;
            case EditTypes.EDIT_REPLACE:
                editBuilder.replace(new vscode_1.Range(this.start, this.end), this.text);
                break;
        }
    }
    // Applies Edits to given WorkspaceEdit
    applyUsingWorkspaceEdit(workspaceEdit, fileUri) {
        switch (this.action) {
            case EditTypes.EDIT_INSERT:
                workspaceEdit.insert(fileUri, this.start, this.text);
                break;
            case EditTypes.EDIT_DELETE:
                workspaceEdit.delete(fileUri, new vscode_1.Range(this.start, this.end));
                break;
            case EditTypes.EDIT_REPLACE:
                workspaceEdit.replace(fileUri, new vscode_1.Range(this.start, this.end), this.text);
                break;
        }
    }
}
exports.Edit = Edit;
/**
 * Uses diff module to parse given array of IUniDiff objects and returns edits for files
 *
 * @param diffOutput jsDiff.IUniDiff[]
 *
 * @returns Array of FilePatch objects, one for each file
 */
function parseUniDiffs(diffOutput) {
    let filePatches = [];
    diffOutput.forEach((uniDiff) => {
        let edit = null;
        let edits = [];
        uniDiff.hunks.forEach((hunk) => {
            let startLine = hunk.oldStart;
            hunk.lines.forEach((line) => {
                switch (line.substr(0, 1)) {
                    case '-':
                        edit = new Edit(EditTypes.EDIT_DELETE, new vscode_1.Position(startLine - 1, 0));
                        edit.end = new vscode_1.Position(startLine, 0);
                        edits.push(edit);
                        startLine++;
                        break;
                    case '+':
                        edit = new Edit(EditTypes.EDIT_INSERT, new vscode_1.Position(startLine - 1, 0));
                        edit.text += line.substr(1) + '\n';
                        edits.push(edit);
                        break;
                    case ' ':
                        startLine++;
                        break;
                }
            });
        });
        let fileName = uniDiff.oldFileName;
        filePatches.push({ fileName, edits });
    });
    return filePatches;
}
/**
 * Returns a FilePatch object by generating diffs between given oldStr and newStr using the diff module
 *
 * @param fileName string: Name of the file to which edits should be applied
 * @param oldStr string
 * @param newStr string
 *
 * @returns A single FilePatch object
 */
function getEdits(fileName, oldStr, newStr) {
    if (process.platform === 'win32') {
        oldStr = oldStr.split('\r\n').join('\n');
        newStr = newStr.split('\r\n').join('\n');
    }
    let unifiedDiffs = jsDiff.structuredPatch(fileName, fileName, oldStr, newStr, '', '');
    let filePatches = parseUniDiffs([unifiedDiffs]);
    return filePatches[0];
}
exports.getEdits = getEdits;
/**
 * Uses diff module to parse given diff string and returns edits for files
 *
 * @param diffStr : Diff string in unified format. http://www.gnu.org/software/diffutils/manual/diffutils.html#Unified-Format
 *
 * @returns Array of FilePatch objects, one for each file
 */
function getEditsFromUnifiedDiffStr(diffstr) {
    let unifiedDiffs = jsDiff.parsePatch(diffstr);
    let filePatches = parseUniDiffs(unifiedDiffs);
    return filePatches;
}
exports.getEditsFromUnifiedDiffStr = getEditsFromUnifiedDiffStr;
//# sourceMappingURL=diffUtils.js.map