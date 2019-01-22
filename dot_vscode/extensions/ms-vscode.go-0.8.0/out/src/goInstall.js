"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const util_1 = require("./util");
const goStatus_1 = require("./goStatus");
const goPath_1 = require("./goPath");
const cp = require("child_process");
function installCurrentPackage() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active, cannot find current package to install');
        return;
    }
    if (editor.document.languageId !== 'go') {
        vscode.window.showInformationMessage('File in the active editor is not a Go file, cannot find current package to install');
        return;
    }
    let goRuntimePath = util_1.getBinPath('go');
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return;
    }
    const env = Object.assign({}, util_1.getToolsEnvVars());
    const cwd = path.dirname(editor.document.uri.fsPath);
    const goConfig = vscode.workspace.getConfiguration('go', editor.document.uri);
    const buildFlags = goConfig['buildFlags'] || [];
    const args = ['install', ...buildFlags];
    if (goConfig['buildTags'] && buildFlags.indexOf('-tags') === -1) {
        args.push('-tags', goConfig['buildTags']);
    }
    // Find the right importPath instead of directly using `.`. Fixes https://github.com/Microsoft/vscode-go/issues/846
    const currentGoWorkspace = goPath_1.getCurrentGoWorkspaceFromGOPATH(util_1.getCurrentGoPath(), cwd);
    const importPath = currentGoWorkspace ? cwd.substr(currentGoWorkspace.length + 1) : '.';
    args.push(importPath);
    goStatus_1.outputChannel.clear();
    goStatus_1.outputChannel.show();
    goStatus_1.outputChannel.appendLine(`Installing ${importPath === '.' ? 'current package' : importPath}`);
    cp.execFile(goRuntimePath, args, { env, cwd }, (err, stdout, stderr) => {
        goStatus_1.outputChannel.appendLine(err ? `Installation failed: ${stderr}` : `Installation successful`);
    });
}
exports.installCurrentPackage = installCurrentPackage;
//# sourceMappingURL=goInstall.js.map