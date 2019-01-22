"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class GoBaseCodeLensProvider {
    constructor() {
        this.enabled = true;
        this.onDidChangeCodeLensesEmitter = new vscode.EventEmitter();
    }
    get onDidChangeCodeLenses() {
        return this.onDidChangeCodeLensesEmitter.event;
    }
    setEnabled(enabled) {
        if (this.enabled !== enabled) {
            this.enabled = enabled;
            this.onDidChangeCodeLensesEmitter.fire();
        }
    }
    provideCodeLenses(document, token) {
        return [];
    }
}
exports.GoBaseCodeLensProvider = GoBaseCodeLensProvider;
//# sourceMappingURL=goBaseCodelens.js.map