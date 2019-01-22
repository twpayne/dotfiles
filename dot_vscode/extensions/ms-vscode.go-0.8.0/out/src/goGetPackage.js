'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
const goStatus_1 = require("./goStatus");
const goBuild_1 = require("./goBuild");
function goGetPackage() {
    const editor = vscode.window.activeTextEditor;
    const selection = editor.selection;
    const selectedText = editor.document.lineAt(selection.active.line).text;
    const importPath = util_1.getImportPath(selectedText);
    if (importPath === '') {
        vscode.window.showErrorMessage('No import path to get');
        return;
    }
    const goRuntimePath = util_1.getBinPath('go');
    if (!goRuntimePath) {
        return vscode.window.showErrorMessage('Could not locate Go binaries. Make sure you have Go installed');
    }
    const env = Object.assign({}, process.env, { GOPATH: util_1.getCurrentGoPath() });
    cp.execFile(goRuntimePath, ['get', '-v', importPath], { env }, (err, stdout, stderr) => {
        // go get -v uses stderr to write output regardless of success or failure
        if (stderr !== '') {
            goStatus_1.outputChannel.show();
            goStatus_1.outputChannel.clear();
            goStatus_1.outputChannel.appendLine(stderr);
            goBuild_1.buildCode();
            return;
        }
        // go get -v doesn't write anything when the package already exists
        vscode.window.showInformationMessage(`Package already exists: ${importPath}`);
    });
}
exports.goGetPackage = goGetPackage;
//# sourceMappingURL=goGetPackage.js.map