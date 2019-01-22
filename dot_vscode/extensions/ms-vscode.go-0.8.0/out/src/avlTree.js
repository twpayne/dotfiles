"use strict";
/**
 * @license
 * Copyright Daniel Imms <http://www.growingwiththeweb.com>
 * Released under MIT license:
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Daniel Imms, http://www.growingwiththeweb.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Modified by Jackson Kearl <Microsoft/t-jakea@microsoft.com>
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents a node in the binary tree, which has a key and a value, as well as left and right subtrees
 */
class Node {
    /**
     * Creates a new AVL Tree node.
     * @param key The key of the new node.
     * @param value The value of the new node.
     */
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.left = null;
        this.right = null;
        this.height = null;
    }
    /**
     * Performs a right rotate on this node.
     * @return The root of the sub-tree; the node where this node used to be.
     */
    rotateRight() {
        //     b                           a
        //    / \                         / \
        //   a   e -> b.rotateRight() -> c   b
        //  / \                             / \
        // c   d                           d   e
        const other = this.left;
        this.left = other.right;
        other.right = this;
        this.height = Math.max(this.leftHeight, this.rightHeight) + 1;
        other.height = Math.max(other.leftHeight, this.height) + 1;
        return other;
    }
    /**
     * Performs a left rotate on this node.
     * @return The root of the sub-tree; the node where this node used to be.
     */
    rotateLeft() {
        //   a                              b
        //  / \                            / \
        // c   b   -> a.rotateLeft() ->   a   e
        //    / \                        / \
        //   d   e                      c   d
        const other = this.right;
        this.right = other.left;
        other.left = this;
        this.height = Math.max(this.leftHeight, this.rightHeight) + 1;
        other.height = Math.max(other.rightHeight, this.height) + 1;
        return other;
    }
    /**
     * Convenience function to get the height of the left child of the node,
     * returning -1 if the node is null.
     * @return The height of the left child, or -1 if it doesn't exist.
     */
    get leftHeight() {
        if (!this.left) {
            return -1;
        }
        return this.left.height;
    }
    /**
     * Convenience function to get the height of the right child of the node,
     * returning -1 if the node is null.
     * @return The height of the right child, or -1 if it doesn't exist.
     */
    get rightHeight() {
        if (!this.right) {
            return -1;
        }
        return this.right.height;
    }
}
exports.Node = Node;
class NearestNeighborDict {
    /**
     * Creates a new AVL Tree.
     */
    constructor(start, _distance, _compare = NearestNeighborDict.DEFAULT_COMPARE_FUNCTION) {
        this._distance = _distance;
        this._compare = _compare;
        this._root = null;
        this.insert(start.key, start.value);
    }
    height() {
        return this._root.height;
    }
    /**
     * Inserts a new node with a specific key into the tree.
     * @param key The key being inserted.
     * @param value The value being inserted.
     */
    insert(key, value) {
        this._root = this._insert(key, value, this._root);
    }
    /**
     * Inserts a new node with a specific key into the tree.
     * @param key The key being inserted.
     * @param root The root of the tree to insert in.
     * @return The new tree root.
     */
    _insert(key, value, root) {
        // Perform regular BST insertion
        if (root === null) {
            return new Node(key, value);
        }
        if (this._compare(key, root.key) < 0) {
            root.left = this._insert(key, value, root.left);
        }
        else if (this._compare(key, root.key) > 0) {
            root.right = this._insert(key, value, root.right);
        }
        else {
            return root;
        }
        // Update height and rebalance tree
        root.height = Math.max(root.leftHeight, root.rightHeight) + 1;
        const balanceState = this._getBalanceState(root);
        if (balanceState === 4 /* UNBALANCED_LEFT */) {
            if (this._compare(key, root.left.key) < 0) {
                // Left left case
                root = root.rotateRight();
            }
            else {
                // Left right case
                root.left = root.left.rotateLeft();
                return root.rotateRight();
            }
        }
        if (balanceState === 0 /* UNBALANCED_RIGHT */) {
            if (this._compare(key, root.right.key) > 0) {
                // Right right case
                root = root.rotateLeft();
            }
            else {
                // Right left case
                root.right = root.right.rotateRight();
                return root.rotateLeft();
            }
        }
        return root;
    }
    /**
     * Gets a node within the tree with a specific key, or the nearest neighbor to that node if it does not exist.
     * @param key The key being searched for.
     * @return The (key, value) pair of the node with key nearest the given key in value.
     */
    getNearest(key) {
        return this._getNearest(key, this._root, this._root);
    }
    /**
     * Gets a node within the tree with a specific key, or the node closest (as measured by this._distance) to that node if the key is not present
     * @param key The key being searched for.
     * @param root The root of the tree to search in.
     * @param closest The current best estimate of the node closest to the node being searched for, as measured by this._distance
     * @return The (key, value) pair of the node with key nearest the given key in value.
     */
    _getNearest(key, root, closest) {
        const result = this._compare(key, root.key);
        if (result === 0) {
            return root;
        }
        closest = this._distance(key, root.key) < this._distance(key, closest.key) ? root : closest;
        if (result < 0) {
            return root.left ? this._getNearest(key, root.left, closest) : closest;
        }
        else {
            return root.right ? this._getNearest(key, root.right, closest) : closest;
        }
    }
    /**
     * Gets the balance state of a node, indicating whether the left or right
     * sub-trees are unbalanced.
     * @param node The node to get the difference from.
     * @return The BalanceState of the node.
     */
    _getBalanceState(node) {
        const heightDifference = node.leftHeight - node.rightHeight;
        switch (heightDifference) {
            case -2: return 0 /* UNBALANCED_RIGHT */;
            case -1: return 1 /* SLIGHTLY_UNBALANCED_RIGHT */;
            case 1: return 3 /* SLIGHTLY_UNBALANCED_LEFT */;
            case 2: return 4 /* UNBALANCED_LEFT */;
            case 0: return 2 /* BALANCED */;
            default: {
                console.error('Internal error: Avl tree should never be more than two levels unbalanced');
                if (heightDifference > 0)
                    return 4 /* UNBALANCED_LEFT */;
                if (heightDifference < 0)
                    return 0 /* UNBALANCED_RIGHT */;
            }
        }
    }
}
NearestNeighborDict.NUMERIC_DISTANCE_FUNCTION = (a, b) => a > b ? a - b : b - a;
NearestNeighborDict.DEFAULT_COMPARE_FUNCTION = (a, b) => a > b ? 1 : a < b ? -1 : 0;
exports.NearestNeighborDict = NearestNeighborDict;
//# sourceMappingURL=avlTree.js.map