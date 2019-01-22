/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const vscode_1 = require("vscode");
const testUtils_1 = require("./testUtils");
const goOutline_1 = require("./goOutline");
const util_1 = require("./util");
const goBaseCodelens_1 = require("./goBaseCodelens");
class GoRunTestCodeLensProvider extends goBaseCodelens_1.GoBaseCodeLensProvider {
    constructor() {
        super(...arguments);
        this.benchmarkRegex = /^Benchmark.+/;
        this.debugConfig = {
            'name': 'Launch',
            'type': 'go',
            'request': 'launch',
            'mode': 'test',
            'env': {
                'GOPATH': util_1.getCurrentGoPath() // Passing current GOPATH to Delve as it runs in another process
            }
        };
    }
    provideCodeLenses(document, token) {
        if (!this.enabled) {
            return [];
        }
        let config = vscode.workspace.getConfiguration('go', document.uri);
        let codeLensConfig = config.get('enableCodeLens');
        let codelensEnabled = codeLensConfig ? codeLensConfig['runtest'] : false;
        if (!codelensEnabled || !document.fileName.endsWith('_test.go')) {
            return [];
        }
        return Promise.all([
            this.getCodeLensForPackage(document, token),
            this.getCodeLensForFunctions(config, document, token)
        ]).then(([pkg, fns]) => {
            let res = [];
            if (pkg && Array.isArray(pkg)) {
                res = res.concat(pkg);
            }
            if (fns && Array.isArray(fns)) {
                res = res.concat(fns);
            }
            return res;
        });
    }
    getCodeLensForPackage(document, token) {
        let documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
        return documentSymbolProvider.provideDocumentSymbols(document, token)
            .then(symbols => {
            const pkg = symbols.find(sym => sym.kind === vscode.SymbolKind.Package && !!sym.name);
            if (!pkg) {
                return;
            }
            const range = pkg.location.range;
            const packageCodeLens = [
                new vscode_1.CodeLens(range, {
                    title: 'run package tests',
                    command: 'go.test.package'
                }),
                new vscode_1.CodeLens(range, {
                    title: 'run file tests',
                    command: 'go.test.file'
                })
            ];
            if (symbols.some(sym => sym.kind === vscode.SymbolKind.Function && this.benchmarkRegex.test(sym.name))) {
                packageCodeLens.push(new vscode_1.CodeLens(range, {
                    title: 'run package benchmarks',
                    command: 'go.benchmark.package'
                }), new vscode_1.CodeLens(range, {
                    title: 'run file benchmarks',
                    command: 'go.benchmark.file'
                }));
            }
            return packageCodeLens;
        });
    }
    getCodeLensForFunctions(vsConfig, document, token) {
        const codelens = [];
        const program = path.dirname(document.fileName);
        const env = Object.assign({}, this.debugConfig.env, vsConfig['testEnvVars']);
        const envFile = vsConfig['testEnvFile'];
        const buildFlags = testUtils_1.getTestFlags(vsConfig, null);
        if (vsConfig['buildTags'] && buildFlags.indexOf('-tags') === -1) {
            buildFlags.push('-tags');
            buildFlags.push(`${vsConfig['buildTags']}`);
        }
        const currentDebugConfig = Object.assign({}, this.debugConfig, { program, env, envFile, buildFlags: buildFlags.map(x => `'${x}'`).join(' ') });
        const testPromise = testUtils_1.getTestFunctions(document, token).then(testFunctions => {
            testFunctions.forEach(func => {
                let runTestCmd = {
                    title: 'run test',
                    command: 'go.test.cursor',
                    arguments: [{ functionName: func.name }]
                };
                codelens.push(new vscode_1.CodeLens(func.location.range, runTestCmd));
                let args = [];
                let instanceMethod = testUtils_1.extractInstanceTestName(func.name);
                if (instanceMethod) {
                    const testFns = testUtils_1.findAllTestSuiteRuns(document, testFunctions);
                    if (testFns && testFns.length > 0) {
                        args = args.concat('-test.run', `^${testFns.map(t => t.name).join('|')}$`);
                    }
                    args = args.concat('-testify.m', `^${instanceMethod}$`);
                }
                else {
                    args = args.concat('-test.run', `^${func.name}$`);
                }
                let debugTestCmd = {
                    title: 'debug test',
                    command: 'go.debug.startSession',
                    arguments: [Object.assign({}, currentDebugConfig, { args: args })]
                };
                codelens.push(new vscode_1.CodeLens(func.location.range, debugTestCmd));
            });
        });
        const benchmarkPromise = testUtils_1.getBenchmarkFunctions(document, token).then(benchmarkFunctions => {
            benchmarkFunctions.forEach(func => {
                let runBenchmarkCmd = {
                    title: 'run benchmark',
                    command: 'go.benchmark.cursor',
                    arguments: [{ functionName: func.name }]
                };
                codelens.push(new vscode_1.CodeLens(func.location.range, runBenchmarkCmd));
                let debugTestCmd = {
                    title: 'debug benchmark',
                    command: 'go.debug.startSession',
                    arguments: [Object.assign({}, currentDebugConfig, { args: ['-test.bench', '^' + func.name + '$', '-test.run', 'a^'] })]
                };
                codelens.push(new vscode_1.CodeLens(func.location.range, debugTestCmd));
            });
        });
        return Promise.all([testPromise, benchmarkPromise]).then(() => codelens);
    }
}
exports.GoRunTestCodeLensProvider = GoRunTestCodeLensProvider;
//# sourceMappingURL=goRunTestCodelens.js.map