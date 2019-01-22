"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.String = exports.List = exports.Tuple = exports.These = undefined;

var _Symbol2 = require("../fable-core/Symbol");

var _Symbol3 = _interopRequireDefault(_Symbol2);

var _Util = require("../fable-core/Util");

var _Option = require("../fable-core/Option");

var _List = require("../fable-core/List");

var _List2 = _interopRequireDefault(_List);

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _String2 = require("../fable-core/String");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class These {
  constructor(tag, data) {
    this.tag = tag | 0;
    this.data = data;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Extensions.These",
      interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
      cases: [["This", (0, _Util.GenericParam)("A")], ["That", (0, _Util.GenericParam)("B")], ["These", (0, _Util.GenericParam)("A"), (0, _Util.GenericParam)("B")]]
    };
  }

  Equals(other) {
    return this === other || this.tag === other.tag && (0, _Util.equals)(this.data, other.data);
  }

  CompareTo(other) {
    return (0, _Util.compareUnions)(this, other) | 0;
  }

  static maybeThis(maybeA, b) {
    if (maybeA == null) {
      return new These(1, b);
    } else {
      return new These(2, [(0, _Option.getValue)(maybeA), b]);
    }
  }

  static maybeThat(a, maybeB) {
    if (maybeB == null) {
      return new These(0, a);
    } else {
      return new These(2, [a, (0, _Option.getValue)(maybeB)]);
    }
  }

  static mapThis(f, these) {
    if (these.tag === 1) {
      return new These(1, these.data);
    } else if (these.tag === 2) {
      return new These(2, [f(these.data[0]), these.data[1]]);
    } else {
      return new These(0, f(these.data));
    }
  }

}

exports.These = These;
(0, _Symbol2.setType)("Extensions.These", These);

const Tuple = exports.Tuple = function (__exports) {
  const map = __exports.map = function (f, a, b) {
    return [f(a), f(b)];
  };

  const mapFirst = __exports.mapFirst = function (f, a, b) {
    return [f(a), b];
  };

  const mapSecond = __exports.mapSecond = function (f, a, b) {
    return [a, f(b)];
  };

  const replaceFirst = __exports.replaceFirst = function (x, a, b) {
    return [x, b];
  };

  const replaceSecond = __exports.replaceSecond = function (x, a, b) {
    return [a, x];
  };

  return __exports;
}({});

const List = exports.List = function (__exports) {
  const safeSkip = __exports.safeSkip = function (n, list) {
    safeSkip: while (true) {
      if (n > 0) {
        if (list.tail != null) {
          n = n - 1;
          list = list.tail;
          continue safeSkip;
        } else {
          return new _List2.default();
        }
      } else {
        return list;
      }
    }
  };

  const span = __exports.span = function (predicate) {
    var loop;
    return (0, _CurriedLambda2.default)((loop = function (output, remaining) {
      return remaining.tail != null ? predicate(remaining.head) ? loop(new _List2.default(remaining.head, output), remaining.tail) : [(0, _List.reverse)(output), remaining] : [(0, _List.reverse)(output), new _List2.default()];
    }, (0, _CurriedLambda2.default)(loop)(new _List2.default())));
  };

  const safeSplitAt = __exports.safeSplitAt = function (n, list) {
    return [(0, _List.slice)(0, n - 1, list), safeSkip(n, list)];
  };

  const tryTail = __exports.tryTail = function (list) {
    if (list.tail == null) {
      return null;
    } else {
      return list.tail;
    }
  };

  const tryInit = __exports.tryInit = function (list) {
    return (0, _Option.defaultArg)(tryTail((0, _List.reverse)(list)), null, _List.reverse);
  };

  return __exports;
}({});

const _String = function (__exports) {
  const dropStart = __exports.dropStart = function (n, str) {
    if (n > str.length) {
      return "";
    } else {
      return str.substr(n > 0 ? n : 0);
    }
  };

  const takeStart = __exports.takeStart = function (n, str) {
    if (n > str.length) {
      return str;
    } else {
      return str.substr(0, n > 0 ? n : 0);
    }
  };

  const trim = __exports.trim = function (str) {
    return (0, _String2.trim)(str, "both");
  };

  const trimStart = __exports.trimStart = function (str) {
    return (0, _String2.trim)(str, "start");
  };

  const trimEnd = __exports.trimEnd = function (str) {
    return (0, _String2.trim)(str, "end");
  };

  return __exports;
}({});

exports.String = _String;