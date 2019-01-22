"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WrappableModule = exports.Block = undefined;
exports.comment = comment;
exports.text = text;
exports.ignore = ignore;
exports.length = length;
exports.splitUp = splitUp;

var _Symbol2 = require("../fable-core/Symbol");

var _Symbol3 = _interopRequireDefault(_Symbol2);

var _Nonempty = require("./Nonempty");

var _Util = require("../fable-core/Util");

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _Extensions = require("./Extensions");

var _Seq = require("../fable-core/Seq");

var _Line = require("./Line");

var _String = require("../fable-core/String");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Block {
  constructor(tag, data) {
    this.tag = tag | 0;
    this.data = data;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Block.Block",
      interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
      cases: [["Comment", (0, _Util.makeGeneric)(_Nonempty.Nonempty, {
        T: Block
      })], ["Wrap", (0, _Util.Tuple)([(0, _Util.Tuple)(["string", "string"]), (0, _Util.makeGeneric)(_Nonempty.Nonempty, {
        T: "string"
      })])], ["NoWrap", (0, _Util.makeGeneric)(_Nonempty.Nonempty, {
        T: "string"
      })]]
    };
  }

  Equals(other) {
    return this === other || this.tag === other.tag && (0, _Util.equals)(this.data, other.data);
  }

  CompareTo(other) {
    return (0, _Util.compareUnions)(this, other) | 0;
  }

}

exports.Block = Block;
(0, _Symbol2.setType)("Block.Block", Block);

const WrappableModule = exports.WrappableModule = function (__exports) {
  const mapPrefixes = __exports.mapPrefixes = function () {
    return (0, _CurriedLambda2.default)(function (f, tupledArg) {
      return _Extensions.Tuple.mapFirst(f, tupledArg[0], tupledArg[1]);
    });
  };

  const mapLines = __exports.mapLines = function () {
    return (0, _CurriedLambda2.default)(function (f, tupledArg) {
      return _Extensions.Tuple.mapSecond(f, tupledArg[0], tupledArg[1]);
    });
  };

  const fromLines = __exports.fromLines = function (prefixes, lines) {
    return [prefixes, lines];
  };

  const toLines = __exports.toLines = function (_arg1, lines) {
    return (0, _Nonempty.mapTail)(function (y) {
      return _arg1[1] + y;
    }, (0, _Nonempty.mapHead)(function (y_1) {
      return _arg1[0] + y_1;
    }, lines));
  };

  return __exports;
}({});

function comment(parser, wrappable_0, wrappable_1) {
  const wrappable = [wrappable_0, wrappable_1];
  return new Block(0, splitUp(parser, wrappable[0], wrappable[1]));
}

function text(wrappable_0, wrappable_1) {
  const wrappable = [wrappable_0, wrappable_1];
  return new Block(1, wrappable);
}

function ignore(lines) {
  return new Block(2, lines);
}

function length(block) {
  if (block.tag === 1) {
    const lines = block.data[1];
    return (0, _Nonempty.length)()(lines) | 0;
  } else if (block.tag === 2) {
    return (0, _Nonempty.length)()(block.data) | 0;
  } else {
    return function (list) {
      return (0, _Seq.sumBy)(length, list);
    }((0, _Nonempty.toList)(block.data)) | 0;
  }
}

function splitUp(parser, _arg2, lines) {
  const concatPrefixes = function (tupledArg, tupledArg_1) {
    return [tupledArg[0] + tupledArg_1[0], tupledArg[1] + tupledArg_1[1]];
  };

  const prependPrefixTrimEndOfBlankLine = function (p, s) {
    if ((0, _Line.isBlank)(s)) {
      return (0, _String.trim)(p, "end");
    } else {
      return p + s;
    }
  };

  const prependPrefixes = function (p_1, block) {
    if (block.tag === 1) {
      return new Block(1, (0, _CurriedLambda2.default)(WrappableModule.mapPrefixes())((0, _CurriedLambda2.default)(concatPrefixes)(p_1), block.data));
    } else if (block.tag === 2) {
      return new Block(2, (0, _Nonempty.mapTail)((0, _CurriedLambda2.default)(prependPrefixTrimEndOfBlankLine)(p_1[1]), (0, _Nonempty.mapHead)((0, _CurriedLambda2.default)(prependPrefixTrimEndOfBlankLine)(p_1[0]), block.data)));
    } else {
      return block;
    }
  };

  return (0, _Nonempty.mapTail)((0, _CurriedLambda2.default)(prependPrefixes)([_arg2[1], _arg2[1]]), (0, _Nonempty.mapHead)((0, _CurriedLambda2.default)(prependPrefixes)([_arg2[0], _arg2[1]]), parser(lines)));
}