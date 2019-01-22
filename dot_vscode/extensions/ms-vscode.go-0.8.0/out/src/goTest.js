/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const util_1 = require("./util");
const testUtils_1 = require("./testUtils");
const goCover_1 = require("./goCover");
const goModules_1 = require("./goModules");
// lastTestConfig holds a reference to the last executed TestConfig which allows
// the last test to be easily re-executed.
let lastTestConfig;
/**
* Executes the unit test at the primary cursor using `go test`. Output
* is sent to the 'Go' channel.
*
* @param goConfig Configuration for the Go extension.
*/
function testAtCursor(goConfig, isBenchmark, args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('_test.go')) {
        vscode.window.showInformationMessage('No tests found. Current file is not a test file.');
        return;
    }
    const getFunctions = isBenchmark ? testUtils_1.getBenchmarkFunctions : testUtils_1.getTestFunctions;
    const { tmpCoverPath, testFlags } = makeCoverData(goConfig, 'coverOnSingleTest', args);
    editor.document.save().then(() => {
        return getFunctions(editor.document, null).then(testFunctions => {
            let testFunctionName;
            // We use functionName if it was provided as argument
            // Otherwise find any test function containing the cursor.
            if (args && args.functionName) {
                testFunctionName = args.functionName;
            }
            else {
                for (let func of testFunctions) {
                    let selection = editor.selection;
                    if (selection && func.location.range.contains(selection.start)) {
                        testFunctionName = func.name;
                        break;
                    }
                }
            }
            if (!testFunctionName) {
                vscode.window.showInformationMessage('No test function found at cursor.');
                return;
            }
            let testConfigFns = [testFunctionName];
            if (!isBenchmark && testUtils_1.extractInstanceTestName(testFunctionName)) {
                // find test function with corresponding suite.Run
                const testFns = testUtils_1.findAllTestSuiteRuns(editor.document, testFunctions);
                if (testFns) {
                    testConfigFns = testConfigFns.concat(testFns.map(t => t.name));
                }
            }
            const testConfig = {
                goConfig: goConfig,
                dir: path.dirname(editor.document.fileName),
                flags: testFlags,
                functions: testConfigFns,
                isBenchmark: isBenchmark,
            };
            // Remember this config as the last executed test.
            lastTestConfig = testConfig;
            return goModules_1.isModSupported(editor.document.uri).then(isMod => {
                testConfig.isMod = isMod;
                return testUtils_1.goTest(testConfig).then(success => {
                    if (success && tmpCoverPath) {
                        return goCover_1.applyCodeCoverageToAllEditors(tmpCoverPath, testConfig.dir);
                    }
                });
            });
        });
    }).then(null, err => {
        console.error(err);
    });
}
exports.testAtCursor = testAtCursor;
/**
 * Runs all tests in the package of the source of the active editor.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testCurrentPackage(goConfig, isBenchmark, args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    const { tmpCoverPath, testFlags } = makeCoverData(goConfig, 'coverOnTestPackage', args);
    const testConfig = {
        goConfig: goConfig,
        dir: path.dirname(editor.document.fileName),
        flags: testFlags,
        isBenchmark: isBenchmark,
    };
    // Remember this config as the last executed test.
    lastTestConfig = testConfig;
    goModules_1.isModSupported(editor.document.uri).then(isMod => {
        testConfig.isMod = isMod;
        return testUtils_1.goTest(testConfig).then(success => {
            if (success && tmpCoverPath) {
                return goCover_1.applyCodeCoverageToAllEditors(tmpCoverPath, testConfig.dir);
            }
        }, err => {
            console.log(err);
        });
    });
}
exports.testCurrentPackage = testCurrentPackage;
/**
 * Runs all tests from all directories in the workspace.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testWorkspace(goConfig, args) {
    if (!vscode.workspace.workspaceFolders.length) {
        vscode.window.showInformationMessage('No workspace is open to run tests.');
        return;
    }
    let workspaceUri = vscode.workspace.workspaceFolders[0].uri;
    if (vscode.window.activeTextEditor && vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)) {
        workspaceUri = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri;
    }
    const testConfig = {
        goConfig: goConfig,
        dir: workspaceUri.fsPath,
        flags: testUtils_1.getTestFlags(goConfig, args),
        includeSubDirectories: true
    };
    // Remember this config as the last executed test.
    lastTestConfig = testConfig;
    goModules_1.isModSupported(workspaceUri).then(isMod => {
        testConfig.isMod = isMod;
        testUtils_1.goTest(testConfig).then(null, err => {
            console.error(err);
        });
    });
}
exports.testWorkspace = testWorkspace;
/**
 * Runs all tests in the source of the active editor.
 *
 * @param goConfig Configuration for the Go extension.
 * @param isBenchmark Boolean flag indicating if these are benchmark tests or not.
 */
function testCurrentFile(goConfig, isBenchmark, args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('_test.go')) {
        vscode.window.showInformationMessage('No tests found. Current file is not a test file.');
        return;
    }
    const getFunctions = isBenchmark ? testUtils_1.getBenchmarkFunctions : testUtils_1.getTestFunctions;
    return editor.document.save().then(() => {
        return getFunctions(editor.document, null).then(testFunctions => {
            const testConfig = {
                goConfig: goConfig,
                dir: path.dirname(editor.document.fileName),
                flags: testUtils_1.getTestFlags(goConfig, args),
                functions: testFunctions.map(sym => sym.name),
                isBenchmark: isBenchmark,
            };
            // Remember this config as the last executed test.
            lastTestConfig = testConfig;
            return goModules_1.isModSupported(editor.document.uri).then(isMod => {
                testConfig.isMod = isMod;
                return testUtils_1.goTest(testConfig);
            });
        });
    }).then(null, err => {
        console.error(err);
        return Promise.resolve(false);
    });
}
exports.testCurrentFile = testCurrentFile;
/**
 * Runs the previously executed test.
 */
function testPrevious() {
    if (!lastTestConfig) {
        vscode.window.showInformationMessage('No test has been recently executed.');
        return;
    }
    testUtils_1.goTest(lastTestConfig).then(null, err => {
        console.error(err);
    });
}
exports.testPrevious = testPrevious;
/**
 * Computes the tmp coverage path and needed flags.
 *
 * @param goConfig Configuration for the Go extension.
 */
function makeCoverData(goConfig, confFlag, args) {
    let tmpCoverPath = '';
    let testFlags = testUtils_1.getTestFlags(goConfig, args) || [];
    if (goConfig[confFlag] === true) {
        tmpCoverPath = util_1.getTempFilePath('go-code-cover');
        testFlags.push('-coverprofile=' + tmpCoverPath);
    }
    return { tmpCoverPath, testFlags };
}
//# sourceMappingURL=goTest.js.map