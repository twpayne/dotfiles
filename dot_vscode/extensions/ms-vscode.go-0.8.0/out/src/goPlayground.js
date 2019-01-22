"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const child_process_1 = require("child_process");
const goStatus_1 = require("./goStatus");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
const TOOL_CMD_NAME = 'goplay';
exports.playgroundCommand = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    const binaryLocation = util_1.getBinPath(TOOL_CMD_NAME);
    if (!path.isAbsolute(binaryLocation)) {
        return goInstallTools_1.promptForMissingTool(TOOL_CMD_NAME);
    }
    goStatus_1.outputChannel.clear();
    goStatus_1.outputChannel.show();
    goStatus_1.outputChannel.appendLine('Upload to the Go Playground in progress...\n');
    const selection = editor.selection;
    const code = selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(selection);
    goPlay(code, vscode.workspace.getConfiguration('go', editor.document.uri).get('playground')).then(result => {
        goStatus_1.outputChannel.append(result);
    }, (e) => {
        if (e) {
            goStatus_1.outputChannel.append(e);
        }
    });
};
function goPlay(code, goConfig) {
    const cliArgs = Object.keys(goConfig).map(key => `-${key}=${goConfig[key]}`);
    const binaryLocation = util_1.getBinPath(TOOL_CMD_NAME);
    return new Promise((resolve, reject) => {
        const p = child_process_1.execFile(binaryLocation, [...cliArgs, '-'], (err, stdout, stderr) => {
            if (err && err.code === 'ENOENT') {
                goInstallTools_1.promptForMissingTool(TOOL_CMD_NAME);
                return reject();
            }
            if (err) {
                return reject(`Upload to the Go Playground failed.\n${stdout || stderr || err.message}`);
            }
            return resolve(`Output from the Go Playground:
${stdout || stderr}
Finished running tool: ${binaryLocation} ${cliArgs.join(' ')} -\n`);
        });
        if (p.pid) {
            p.stdin.end(code);
        }
    });
}
exports.goPlay = goPlay;
//# sourceMappingURL=goPlayground.js.map