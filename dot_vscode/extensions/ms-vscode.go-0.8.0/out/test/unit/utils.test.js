"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../src/util");
const assert = require("assert");
const util_2 = require("../../src/util");
suite("utils Tests", () => {
    test("substituteEnv: default", () => {
        // prepare test
        const env = Object.assign({}, process.env);
        process.env["test1"] = "abcd";
        process.env["test2"] = "defg";
        let actual = util_2.substituteEnv(" ${env:test1} \r\n ${env:test2}\r\n${env:test1}");
        let expected = " abcd \r\n defg\r\nabcd";
        assert.equal(actual, expected);
        // test completed
        process.env = env;
    });
});
suite("GuessPackageNameFromFile Tests", () => {
    test("package name from main file", done => {
        const expectedPackageName = "main";
        const filename = "main.go";
        util_1.guessPackageNameFromFile(filename)
            .then(result => {
            assert.equal(result, expectedPackageName);
        })
            .then(() => done(), done);
    });
    test("package name from dirpath", done => {
        const expectedPackageName = "package";
        const fileDir = "path/package/file.go";
        util_1.guessPackageNameFromFile(fileDir)
            .then(([result]) => {
            assert.equal(result, expectedPackageName);
        })
            .then(() => done(), done);
    });
    test("package name from test file", done => {
        const expectedPackageName = "file";
        const expectedPackageTestName = "file_test";
        const fileDir = "file_test.go";
        util_1.guessPackageNameFromFile(fileDir)
            .then(([packageNameResult, packageTestNameResult]) => {
            assert.equal(packageNameResult, expectedPackageName);
            assert.equal(packageTestNameResult, expectedPackageTestName);
        })
            .then(() => done(), done);
    });
});
//# sourceMappingURL=utils.test.js.map