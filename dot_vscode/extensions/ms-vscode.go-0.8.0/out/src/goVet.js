"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const util_1 = require("./util");
const goStatus_1 = require("./goStatus");
const goStatus_2 = require("./goStatus");
const goMain_1 = require("./goMain");
/**
 * Runs go vet in the current package or workspace.
 */
function vetCode(vetWorkspace) {
    let editor = vscode.window.activeTextEditor;
    if (!editor && !vetWorkspace) {
        vscode.window.showInformationMessage('No editor is active, cannot find current package to vet');
        return;
    }
    if (editor.document.languageId !== 'go' && !vetWorkspace) {
        vscode.window.showInformationMessage('File in the active editor is not a Go file, cannot find current package to vet');
        return;
    }
    let documentUri = editor ? editor.document.uri : null;
    let goConfig = vscode.workspace.getConfiguration('go', documentUri);
    goStatus_1.outputChannel.clear(); // Ensures stale output from vet on save is cleared
    goStatus_2.diagnosticsStatusBarItem.show();
    goStatus_2.diagnosticsStatusBarItem.text = 'Vetting...';
    goVet(documentUri, goConfig, vetWorkspace)
        .then(warnings => {
        util_1.handleDiagnosticErrors(editor ? editor.document : null, warnings, goMain_1.vetDiagnosticCollection);
        goStatus_2.diagnosticsStatusBarItem.hide();
    })
        .catch(err => {
        vscode.window.showInformationMessage('Error: ' + err);
        goStatus_2.diagnosticsStatusBarItem.text = 'Vetting Failed';
    });
}
exports.vetCode = vetCode;
/**
 * Runs go vet or go tool vet and presents the output in the 'Go' channel and in the diagnostic collections.
 *
 * @param fileUri Document uri.
 * @param goConfig Configuration for the Go extension.
 * @param vetWorkspace If true vets code in all workspace.
 */
function goVet(fileUri, goConfig, vetWorkspace) {
    epoch++;
    let closureEpoch = epoch;
    if (tokenSource) {
        if (running) {
            tokenSource.cancel();
        }
        tokenSource.dispose();
    }
    tokenSource = new vscode.CancellationTokenSource();
    const currentWorkspace = util_1.getWorkspaceFolderPath(fileUri);
    const cwd = (vetWorkspace && currentWorkspace) ? currentWorkspace : path.dirname(fileUri.fsPath);
    if (!path.isAbsolute(cwd)) {
        return Promise.resolve([]);
    }
    const vetFlags = goConfig['vetFlags'] || [];
    const vetEnv = Object.assign({}, util_1.getToolsEnvVars());
    const vetPromise = util_1.getGoVersion().then((version) => {
        const tagsArg = [];
        if (goConfig['buildTags'] && vetFlags.indexOf('-tags') === -1) {
            tagsArg.push('-tags');
            tagsArg.push(goConfig['buildTags']);
        }
        let vetArgs = ['vet', ...vetFlags, ...tagsArg, './...'];
        if (version && version.major === 1 && version.minor <= 9 && vetFlags.length) {
            vetArgs = ['tool', 'vet', ...vetFlags, ...tagsArg, '.'];
        }
        running = true;
        return util_1.runTool(vetArgs, cwd, 'warning', true, null, vetEnv, false, tokenSource.token).then((result) => {
            if (closureEpoch === epoch)
                running = false;
            return result;
        });
    });
    return vetPromise;
}
exports.goVet = goVet;
let epoch = 0;
let tokenSource;
let running = false;
//# sourceMappingURL=goVet.js.map