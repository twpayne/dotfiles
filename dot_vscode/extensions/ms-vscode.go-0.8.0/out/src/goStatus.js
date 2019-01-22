/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const goMode_1 = require("./goMode");
const vscode = require("vscode");
exports.outputChannel = vscode.window.createOutputChannel('Go');
exports.diagnosticsStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
let statusBarEntry;
function showHideStatus() {
    if (!statusBarEntry) {
        return;
    }
    if (!vscode.window.activeTextEditor) {
        statusBarEntry.hide();
        return;
    }
    if (vscode.languages.match(goMode_1.GO_MODE, vscode.window.activeTextEditor.document)) {
        statusBarEntry.show();
        return;
    }
    statusBarEntry.hide();
}
exports.showHideStatus = showHideStatus;
function hideGoStatus() {
    if (statusBarEntry) {
        statusBarEntry.dispose();
    }
}
exports.hideGoStatus = hideGoStatus;
function showGoStatus(message, command, tooltip) {
    statusBarEntry = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, Number.MIN_VALUE);
    statusBarEntry.text = `$(alert) ${message}`;
    statusBarEntry.command = command;
    statusBarEntry.tooltip = tooltip;
    statusBarEntry.show();
}
exports.showGoStatus = showGoStatus;
//# sourceMappingURL=goStatus.js.map