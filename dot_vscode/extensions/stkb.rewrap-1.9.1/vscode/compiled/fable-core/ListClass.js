"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ofArray = ofArray;

var _Symbol = require("./Symbol");

var _Symbol2 = _interopRequireDefault(_Symbol);

var _Util = require("./Util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// This module is split from List.ts to prevent cyclic dependencies
function ofArray(args, base) {
  let acc = base || new List();
  for (let i = args.length - 1; i >= 0; i--) {
    acc = new List(args[i], acc);
  }
  return acc;
}
class List {
  constructor(head, tail) {
    this.head = head;
    this.tail = tail;
  }
  ToString() {
    return "[" + Array.from(this).map(x => (0, _Util.toString)(x)).join("; ") + "]";
  }
  Equals(other) {
    // Optimization if they are referencially equal
    if (this === other) {
      return true;
    } else {
      let cur1 = this;
      let cur2 = other;
      while ((0, _Util.equals)(cur1.head, cur2.head)) {
        cur1 = cur1.tail;
        cur2 = cur2.tail;
        if (cur1 == null) {
          return cur2 == null;
        }
      }
      return false;
    }
  }
  CompareTo(other) {
    // Optimization if they are referencially equal
    if (this === other) {
      return 0;
    } else {
      let cur1 = this;
      let cur2 = other;
      let res = (0, _Util.compare)(cur1.head, cur2.head);
      while (res === 0) {
        cur1 = cur1.tail;
        cur2 = cur2.tail;
        if (cur1 == null) {
          return cur2 == null ? 0 : -1;
        }
        res = (0, _Util.compare)(cur1.head, cur2.head);
      }
      return res;
    }
  }
  get length() {
    let cur = this;
    let acc = 0;
    while (cur.tail != null) {
      cur = cur.tail;
      acc++;
    }
    return acc;
  }
  [Symbol.iterator]() {
    let cur = this;
    return {
      next: () => {
        const tmp = cur;
        cur = cur.tail;
        return { done: tmp.tail == null, value: tmp.head };
      }
    };
  }
  //   append(ys: List<T>): List<T> {
  //     return append(this, ys);
  //   }
  //   choose<U>(f: (x: T) => U, xs: List<T>): List<U> {
  //     return choose(f, this);
  //   }
  //   collect<U>(f: (x: T) => List<U>): List<U> {
  //     return collect(f, this);
  //   }
  //   filter(f: (x: T) => boolean): List<T> {
  //     return filter(f, this);
  //   }
  //   where(f: (x: T) => boolean): List<T> {
  //     return filter(f, this);
  //   }
  //   map<U>(f: (x: T) => U): List<U> {
  //     return map(f, this);
  //   }
  //   mapIndexed<U>(f: (i: number, x: T) => U): List<U> {
  //     return mapIndexed(f, this);
  //   }
  //   partition(f: (x: T) => boolean): [List<T>, List<T>] {
  //     return partition(f, this) as [List<T>, List<T>];
  //   }
  //   reverse(): List<T> {
  //     return reverse(this);
  //   }
  //   slice(lower: number, upper: number): List<T> {
  //     return slice(lower, upper, this);
  //   }
  [_Symbol2.default.reflection]() {
    return {
      type: "Microsoft.FSharp.Collections.FSharpList",
      interfaces: ["System.IEquatable", "System.IComparable"]
    };
  }
}
exports.default = List;