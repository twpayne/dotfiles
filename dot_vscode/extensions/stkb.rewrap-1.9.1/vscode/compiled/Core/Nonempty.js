"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Nonempty = undefined;
exports.fromList = fromList;
exports.fromListUnsafe = fromListUnsafe;
exports.singleton = singleton;
exports.cons = cons;
exports.snoc = snoc;
exports.append = append;
exports.appendToList = appendToList;
exports.head = head;
exports.tail = tail;
exports.last = last;
exports.length = length;
exports.tryFind = tryFind;
exports.toList = toList;
exports.rev = rev;
exports.map = map;
exports.mapHead = mapHead;
exports.mapTail = mapTail;
exports.mapInit = mapInit;
exports.replaceHead = replaceHead;
exports.collect = collect;
exports.splitAt = splitAt;
exports.span = span;
exports.splitAfter = splitAfter;
exports.unfold = unfold;

var _Symbol2 = require("../fable-core/Symbol");

var _Symbol3 = _interopRequireDefault(_Symbol2);

var _Util = require("../fable-core/Util");

var _List = require("../fable-core/List");

var _List2 = _interopRequireDefault(_List);

var _Option = require("../fable-core/Option");

var _Seq = require("../fable-core/Seq");

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _Extensions = require("./Extensions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Nonempty {
  constructor(tag, data) {
    this.tag = tag | 0;
    this.data = data;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Nonempty.Nonempty",
      interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
      cases: [["Nonempty", (0, _Util.GenericParam)("T"), (0, _Util.makeGeneric)(_List2.default, {
        T: (0, _Util.GenericParam)("T")
      })]]
    };
  }

  Equals(other) {
    return this === other || this.tag === other.tag && (0, _Util.equals)(this.data, other.data);
  }

  CompareTo(other) {
    return (0, _Util.compareUnions)(this, other) | 0;
  }

  static op_Addition(a, b) {
    return append(a, b);
  }

}

exports.Nonempty = Nonempty;
(0, _Symbol2.setType)("Nonempty.Nonempty", Nonempty);

function fromList(list) {
  if (list.tail != null) {
    return new Nonempty(0, [list.head, list.tail]);
  } else {
    return null;
  }
}

function fromListUnsafe(list) {
  return new Nonempty(0, [(0, _List.head)(list), (0, _List.tail)(list)]);
}

function singleton(head) {
  return new Nonempty(0, [head, new _List2.default()]);
}

function cons(head, neList) {
  return new Nonempty(0, [head, toList(neList)]);
}

function snoc(last, _arg1) {
  return new Nonempty(0, [_arg1.data[0], (0, _List.append)(_arg1.data[1], (0, _List.ofArray)([last]))]);
}

function append(_arg2, b) {
  return new Nonempty(0, [_arg2.data[0], (0, _List.append)(_arg2.data[1], toList(b))]);
}

function appendToList(listA, neListB) {
  const matchValue = fromList(listA);

  if (matchValue == null) {
    return neListB;
  } else {
    return append((0, _Option.getValue)(matchValue), neListB);
  }
}

function head(_arg3) {
  return _arg3.data[0];
}

function tail(_arg4) {
  return _arg4.data[1];
}

function last(_arg5) {
  return function (option) {
    return (0, _Option.defaultArg)(option, _arg5.data[0]);
  }((0, _Seq.tryLast)(_arg5.data[1]));
}

function length() {
  return (0, _CurriedLambda2.default)($var2 => function (y) {
    return 1 + y;
  }(($var1 => tail($var1).length)($var2)));
}

function tryFind(predicate) {
  return (0, _CurriedLambda2.default)($var3 => function (list) {
    return (0, _Seq.tryFind)(predicate, list);
  }(toList($var3)));
}

function toList(_arg6) {
  return new _List2.default(_arg6.data[0], _arg6.data[1]);
}

function rev() {
  return (0, _CurriedLambda2.default)($var5 => fromListUnsafe(($var4 => (0, _List.reverse)(toList($var4)))($var5)));
}

function map(fn, _arg7) {
  return new Nonempty(0, [fn(_arg7.data[0]), (0, _List.map)(fn, _arg7.data[1])]);
}

function mapHead(fn, _arg8) {
  return new Nonempty(0, [fn(_arg8.data[0]), _arg8.data[1]]);
}

function mapTail(fn, _arg9) {
  return new Nonempty(0, [_arg9.data[0], (0, _List.map)(fn, _arg9.data[1])]);
}

function mapInit(fn) {
  return (0, _CurriedLambda2.default)($var7 => rev()(($var6 => function (arg10_) {
    return mapTail(fn, arg10_);
  }(rev()($var6)))($var7)));
}

function replaceHead(newHead) {
  var fn;
  return (0, _CurriedLambda2.default)((fn = function (_arg1) {
    return newHead;
  }, function (arg10_) {
    return mapHead(fn, arg10_);
  }));
}

function collect(fn, neList) {
  const loop = function (output, input) {
    loop: while (true) {
      if (input.tail == null) {
        return output;
      } else {
        output = Nonempty.op_Addition(fn(input.head), output);
        input = input.tail;
        continue loop;
      }
    }
  };

  return function (_arg1) {
    return loop(fn(_arg1.data[0]), _arg1.data[1]);
  }(rev()(neList));
}

function splitAt(n, _arg10) {
  var f;

  const loop = function (count, left, maybeRight) {
    loop: while (true) {
      if (maybeRight != null) {
        const xs = (0, _Option.getValue)(maybeRight).data[1];
        const x = (0, _Option.getValue)(maybeRight).data[0];

        if (count < 1) {
          return [left, maybeRight];
        } else {
          count = count - 1;
          left = cons(x, left);
          maybeRight = fromList(xs);
          continue loop;
        }
      } else {
        return [left, null];
      }
    }
  };

  return (f = rev(), function (tupledArg) {
    return _Extensions.Tuple.mapFirst(f, tupledArg[0], tupledArg[1]);
  })(loop(n - 1, singleton(_arg10.data[0]), fromList(_arg10.data[1])));
}

function span(predicate) {
  var loop;
  return (0, _CurriedLambda2.default)((loop = function (output, maybeRemaining) {
    if (maybeRemaining != null) {
      const tail_1 = (0, _Option.getValue)(maybeRemaining).data[1];
      const head_1 = (0, _Option.getValue)(maybeRemaining).data[0];

      if (predicate(head_1)) {
        return loop(new _List2.default(head_1, output), fromList(tail_1));
      } else {
        return (0, _Option.defaultArg)(fromList((0, _List.reverse)(output)), null, function (o) {
          return [o, maybeRemaining];
        });
      }
    } else {
      return (0, _Option.defaultArg)(fromList((0, _List.reverse)(output)), null, function (o_1) {
        return [o_1, maybeRemaining];
      });
    }
  }, $var8 => (0, _CurriedLambda2.default)(loop)(new _List2.default())(function (arg0) {
    return arg0;
  }($var8))));
}

function splitAfter(predicate) {
  var loop;
  return (0, _CurriedLambda2.default)((loop = function (output, _arg11) {
    const maybeNextList = fromList(_arg11.data[1]);

    if (predicate(_arg11.data[0])) {
      return [new Nonempty(0, [_arg11.data[0], output]), maybeNextList];
    } else if (maybeNextList == null) {
      return [new Nonempty(0, [_arg11.data[0], output]), null];
    } else {
      return loop(new _List2.default(_arg11.data[0], output), (0, _Option.getValue)(maybeNextList));
    }
  }, $var9 => {
    var f;
    return (f = rev(), function (tupledArg) {
      return _Extensions.Tuple.mapFirst(f, tupledArg[0], tupledArg[1]);
    })((0, _CurriedLambda2.default)(loop)(new _List2.default())($var9));
  }));
}

function unfold(fn) {
  var loop;
  return (0, _CurriedLambda2.default)((loop = function (output, input) {
    const matchValue = fn(input);

    if (matchValue[1] == null) {
      return new Nonempty(0, [matchValue[0], output]);
    } else {
      const nextInput = (0, _Option.getValue)(matchValue[1]);
      return loop(new _List2.default(matchValue[0], output), nextInput);
    }
  }, $var10 => rev()((0, _CurriedLambda2.default)(loop)(new _List2.default())($var10))));
}