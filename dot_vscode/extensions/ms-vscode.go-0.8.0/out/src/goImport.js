/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
const goOutline_1 = require("./goOutline");
const goInstallTools_1 = require("./goInstallTools");
const goPackages_1 = require("./goPackages");
const missingToolMsg = 'Missing tool: ';
function listPackages(excludeImportedPkgs = false) {
    let importsPromise = excludeImportedPkgs && vscode.window.activeTextEditor ? getImports(vscode.window.activeTextEditor.document) : Promise.resolve([]);
    let pkgsPromise = goPackages_1.getImportablePackages(vscode.window.activeTextEditor.document.fileName, true);
    return Promise.all([pkgsPromise, importsPromise]).then(([pkgMap, importedPkgs]) => {
        importedPkgs.forEach(pkg => {
            pkgMap.delete(pkg);
        });
        return Array.from(pkgMap.keys()).sort();
    });
}
exports.listPackages = listPackages;
/**
 * Returns the imported packages in the given file
 *
 * @param document TextDocument whose imports need to be returned
 * @returns Array of imported package paths wrapped in a promise
 */
function getImports(document) {
    let options = { fileName: document.fileName, importsOption: goOutline_1.GoOutlineImportsOptions.Only, document, skipRanges: true };
    return goOutline_1.documentSymbols(options, null).then(symbols => {
        if (!symbols || !symbols.length) {
            return [];
        }
        // import names will be of the form "math", so strip the quotes in the beginning and the end
        let imports = symbols.filter(x => x.kind === vscode.SymbolKind.Namespace).map(x => x.name.substr(1, x.name.length - 2));
        return imports;
    });
}
function askUserForImport() {
    return listPackages(true).then(packages => {
        return vscode.window.showQuickPick(packages);
    }, err => {
        if (typeof err === 'string' && err.startsWith(missingToolMsg)) {
            goInstallTools_1.promptForMissingTool(err.substr(missingToolMsg.length));
        }
    });
}
function getTextEditForAddImport(arg) {
    // Import name wasn't provided
    if (arg === undefined) {
        return null;
    }
    let { imports, pkg } = util_1.parseFilePrelude(vscode.window.activeTextEditor.document.getText());
    if (imports.some(block => block.pkgs.some(pkgpath => pkgpath === arg))) {
        return [];
    }
    let multis = imports.filter(x => x.kind === 'multi');
    if (multis.length > 0) {
        // There is a multiple import declaration, add to the last one
        const lastImportSection = multis[multis.length - 1];
        if (lastImportSection.end === -1) {
            // For some reason there was an empty import section like `import ()`
            return [vscode.TextEdit.insert(new vscode.Position(lastImportSection.start + 1, 0), `import "${arg}"\n`)];
        }
        // Add import at the start of the block so that goimports/goreturns can order them correctly
        return [vscode.TextEdit.insert(new vscode.Position(lastImportSection.start + 1, 0), '\t"' + arg + '"\n')];
    }
    else if (imports.length > 0) {
        // There are some number of single line imports, which can just be collapsed into a block import.
        const edits = [];
        edits.push(vscode.TextEdit.insert(new vscode.Position(imports[0].start, 0), 'import (\n\t"' + arg + '"\n'));
        imports.forEach(element => {
            const currentLine = vscode.window.activeTextEditor.document.lineAt(element.start).text;
            const updatedLine = currentLine.replace(/^\s*import\s*/, '\t');
            edits.push(vscode.TextEdit.replace(new vscode.Range(element.start, 0, element.start, currentLine.length), updatedLine));
        });
        edits.push(vscode.TextEdit.insert(new vscode.Position(imports[imports.length - 1].end + 1, 0), ')\n'));
        return edits;
    }
    else if (pkg && pkg.start >= 0) {
        // There are no import declarations, but there is a package declaration
        return [vscode.TextEdit.insert(new vscode.Position(pkg.start + 1, 0), '\nimport (\n\t"' + arg + '"\n)\n')];
    }
    else {
        // There are no imports and no package declaration - give up
        return [];
    }
}
exports.getTextEditForAddImport = getTextEditForAddImport;
function addImport(arg) {
    let p = arg ? Promise.resolve(arg) : askUserForImport();
    p.then(imp => {
        let edits = getTextEditForAddImport(imp);
        if (edits && edits.length > 0) {
            const edit = new vscode.WorkspaceEdit();
            edit.set(vscode.window.activeTextEditor.document.uri, edits);
            vscode.workspace.applyEdit(edit);
        }
    });
}
exports.addImport = addImport;
function addImportToWorkspace() {
    const editor = vscode.window.activeTextEditor;
    const selection = editor.selection;
    let importPath = '';
    if (!selection.isEmpty) {
        let selectedText = editor.document.getText(selection).trim();
        if (selectedText.length > 0) {
            if (selectedText.indexOf(' ') === -1) {
                // Attempt to load a partial import path based on currently selected text
                if (!selectedText.startsWith('"')) {
                    selectedText = '"' + selectedText;
                }
                if (!selectedText.endsWith('"')) {
                    selectedText = selectedText + '"';
                }
            }
            importPath = util_1.getImportPath(selectedText);
        }
    }
    if (importPath === '') {
        // Failing that use the current line
        let selectedText = editor.document.lineAt(selection.active.line).text;
        importPath = util_1.getImportPath(selectedText);
    }
    if (importPath === '') {
        vscode.window.showErrorMessage('No import path to add');
        return;
    }
    const goRuntimePath = util_1.getBinPath('go');
    const env = util_1.getToolsEnvVars();
    cp.execFile(goRuntimePath, ['list', '-f', '{{.Dir}}', importPath], { env }, (err, stdout, stderr) => {
        let dirs = (stdout || '').split('\n');
        if (!dirs.length || !dirs[0].trim()) {
            vscode.window.showErrorMessage(`Could not find package ${importPath}`);
            return;
        }
        const importPathUri = vscode.Uri.file(dirs[0]);
        const existingWorkspaceFolder = vscode.workspace.getWorkspaceFolder(importPathUri);
        if (existingWorkspaceFolder !== undefined) {
            vscode.window.showInformationMessage('Already available under ' + existingWorkspaceFolder.name);
            return;
        }
        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: importPathUri });
    });
}
exports.addImportToWorkspace = addImportToWorkspace;
//# sourceMappingURL=goImport.js.map