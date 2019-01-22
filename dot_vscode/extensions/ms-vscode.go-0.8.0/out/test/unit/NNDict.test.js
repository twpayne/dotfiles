"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const avlTree_1 = require("../../src/avlTree");
suite('NearestNeighborDict Tests', () => {
    test('basic insert/get: random', () => {
        let dict = new avlTree_1.NearestNeighborDict(new avlTree_1.Node(0, 0), avlTree_1.NearestNeighborDict.NUMERIC_DISTANCE_FUNCTION);
        let entries = [5, 2, 9, 23, 3, 0, 1, -4, -2];
        entries.forEach(x => dict.insert(x));
        assert(dict.height() < 4);
        entries.forEach(x => {
            assert.equal(dict.getNearest(x + 0.1).key, x);
            assert.equal(dict.getNearest(x - 0.1).key, x);
        });
        assert.equal(dict.getNearest(23 + 10).key, 23);
        assert.equal(dict.getNearest(23 - 4).key, 23);
    });
    test('basic insert/get: increasing', () => {
        let dict = new avlTree_1.NearestNeighborDict(new avlTree_1.Node(0, 0), avlTree_1.NearestNeighborDict.NUMERIC_DISTANCE_FUNCTION);
        let entries = [-10, -5, -4, -1, 0, 1, 5, 10, 23];
        entries.forEach(x => dict.insert(x));
        assert(dict.height() < 4);
        entries.forEach(x => {
            assert.equal(dict.getNearest(x + 0.1).key, x);
            assert.equal(dict.getNearest(x - 0.1).key, x);
        });
        assert.equal(dict.getNearest(23 + 10).key, 23);
        assert.equal(dict.getNearest(23 - 4).key, 23);
    });
    test('basic insert/get: decreasing', () => {
        let dict = new avlTree_1.NearestNeighborDict(new avlTree_1.Node(0, 0), avlTree_1.NearestNeighborDict.NUMERIC_DISTANCE_FUNCTION);
        let entries = [-10, -5, -4, -1, 0, 1, 5, 10, 23].reverse();
        entries.forEach(x => dict.insert(x));
        assert(dict.height() < 4);
        entries.forEach(x => {
            assert.equal(dict.getNearest(x + 0.1).key, x);
            assert.equal(dict.getNearest(x - 0.1).key, x);
        });
        assert.equal(dict.getNearest(23 + 10).key, 23);
        assert.equal(dict.getNearest(23 - 4).key, 23);
    });
});
//# sourceMappingURL=NNDict.test.js.map