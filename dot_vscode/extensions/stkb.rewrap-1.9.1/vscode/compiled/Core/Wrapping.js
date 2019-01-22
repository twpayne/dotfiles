"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CanBreak = undefined;
exports.charWidthEx = charWidthEx;
exports.isCJK = isCJK;
exports.canBreak = canBreak;
exports.canBreakBetweenChars = canBreakBetweenChars;
exports.wrap = wrap;

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _Symbol2 = require("../fable-core/Symbol");

var _Symbol3 = _interopRequireDefault(_Symbol2);

var _Util = require("../fable-core/Util");

var _Array = require("../fable-core/Array");

var _Extensions = require("./Extensions");

var _Seq = require("../fable-core/Seq");

var _Option = require("../fable-core/Option");

var _List = require("../fable-core/List");

var _List2 = _interopRequireDefault(_List);

var _String = require("../fable-core/String");

var _Nonempty = require("./Nonempty");

var _RegExp = require("../fable-core/RegExp");

var _Line = require("./Line");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function charWidthEx(tabSize, index, charCode) {
  if (charCode === 0) {
    return 1;
  } else if (charCode === 9) {
    return tabSize - index % tabSize | 0;
  } else if (charCode < 32) {
    return 0;
  } else if (charCode < 11904) {
    return 1;
  } else if (charCode >= 11904 ? charCode <= 55215 : false) {
    return 2;
  } else if (charCode >= 63744 ? charCode <= 64255 : false) {
    return 2;
  } else if (charCode >= 65281 ? charCode <= 65374 : false) {
    return 2;
  } else {
    return 1;
  }
}

const charWidth = (0, _CurriedLambda2.default)(function (charCode) {
  return charWidthEx(1, 0, charCode);
});

function isWhitespace(cc) {
  if (cc !== 0 ? cc <= 32 : false) {
    return true;
  } else {
    return cc === 12288;
  }
}

function isCJK(charCode) {
  if ((charCode >= 12352 ? charCode <= 12543 : false) ? true : charCode >= 13312 ? charCode <= 19903 : false) {
    return true;
  } else if (charCode >= 19968) {
    return charCode <= 40959;
  } else {
    return false;
  }
}

class CanBreak {
  constructor(tag) {
    this.tag = tag | 0;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Wrapping.CanBreak",
      interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
      cases: [["Always"], ["Sometimes"], ["Never"]]
    };
  }

  Equals(other) {
    return this.tag === other.tag;
  }

  CompareTo(other) {
    return (0, _Util.comparePrimitives)(this.tag, other.tag);
  }

}

exports.CanBreak = CanBreak;
(0, _Symbol2.setType)("Wrapping.CanBreak", CanBreak);
const specialChars = (0, _Array.map)((() => {
  const f = function (s) {
    return (0, _Array.map)(function (value) {
      return value.charCodeAt(0);
    }, s.split(""), Uint16Array);
  };

  return function (tupledArg) {
    return _Extensions.Tuple.mapSecond(f, tupledArg[0], tupledArg[1]);
  };
})(), [[[new CanBreak(2), new CanBreak(1)], "})]?,;¢°′″‰℃"], [[new CanBreak(2), new CanBreak(0)], "、。｡､￠，．：；？！％・･ゝゞヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻ｧｨｩｪｫｬｭｮｯｰ”〉》」』】〕）］｝｣"], [[new CanBreak(1), new CanBreak(2)], "([{"], [[new CanBreak(0), new CanBreak(2)], "‘“〈《「『【〔（［｛｢£¥＄￡￥＋"]], Array);

function canBreak(charCode) {
  if (isWhitespace(charCode)) {
    return [new CanBreak(0), new CanBreak(0)];
  } else {
    const matchValue = (0, _Seq.tryFind)($var2 => function (array) {
      return (0, _Seq.exists)($var1 => (0, _Util.equals)(charCode, $var1), array);
    }(function (tuple) {
      return tuple[1];
    }($var2)), specialChars);

    if (matchValue == null) {
      if (isCJK(charCode)) {
        return [new CanBreak(0), new CanBreak(0)];
      } else {
        return [new CanBreak(1), new CanBreak(1)];
      }
    } else {
      const res = (0, _Option.getValue)(matchValue)[0];
      return res;
    }
  }
}

const canBreakBefore = (0, _CurriedLambda2.default)($var3 => canBreak($var3)[0]);
const canBreakAfter = (0, _CurriedLambda2.default)($var4 => canBreak($var4)[1]);

function canBreakBetweenChars(c1, c2) {
  const matchValue = [canBreakAfter(c1), canBreakBefore(c2)];
  const $var5 = matchValue[0].tag === 1 ? matchValue[1].tag === 1 ? [0] : matchValue[1].tag === 2 ? [2] : [3] : matchValue[0].tag === 2 ? [1] : matchValue[1].tag === 2 ? [2] : [3];

  switch ($var5[0]) {
    case 0:
      return false;

    case 1:
      return false;

    case 2:
      return false;

    case 3:
      return true;
  }
}

function wrapLines(headWidth, tailWidth, lines) {
  const addEolSpacesWhereNeeded = function (ls, l) {
    const compare = function (h) {
      const matchValue = [canBreakAfter(h[h.length - 1].charCodeAt(0)), canBreakBefore(l[0].charCodeAt(0))];
      const $var6 = matchValue[0].tag === 1 ? matchValue[1].tag === 1 ? [0] : [1] : [1];

      switch ($var6[0]) {
        case 0:
          return (0, _List.ofArray)([l, " "], ls);

        case 1:
          return new _List2.default(l, ls);
      }
    };

    if (ls.tail != null) {
      return compare(ls.head);
    } else {
      return (0, _List.ofArray)([l]);
    }
  };

  const str = (0, _String.join)("", (0, _List.reverse)((0, _Seq.fold)(addEolSpacesWhereNeeded, new _List2.default(), (0, _Nonempty.toList)(lines))));

  const findBreakPos = function (min, p) {
    findBreakPos: while (true) {
      if (p === min) {
        return min | 0;
      } else if (canBreakBetweenChars(str[p - 1].charCodeAt(0), str[p].charCodeAt(0))) {
        return p | 0;
      } else {
        min = min;
        p = p - 1;
        continue findBreakPos;
      }
    }
  };

  const loop = function (acc, mw, s, p_1, w) {
    loop: while (true) {
      if (p_1 >= str.length) {
        return new _Nonempty.Nonempty(0, [str.substr(s), acc]);
      } else {
        const cc = str[p_1].charCodeAt(0);

        if (p_1 === s ? isWhitespace(cc) : false) {
          acc = acc;
          mw = mw;
          s = s + 1;
          p_1 = p_1 + 1;
          w = w;
          continue loop;
        } else {
          const w_ = w + charWidth(cc) | 0;

          if (w_ <= mw) {
            acc = acc;
            mw = mw;
            s = s;
            p_1 = p_1 + 1;
            w = w_;
            continue loop;
          } else {
            const bP = findBreakPos(s, p_1) | 0;

            if (bP === s) {
              acc = acc;
              mw = mw;
              s = s;
              p_1 = p_1 + 1;
              w = w_;
              continue loop;
            } else {
              const line = (0, _String.trim)(str.substr(s, bP - s), "end");
              acc = new _List2.default(line, acc);
              mw = tailWidth;
              s = bP;
              p_1 = bP;
              w = 0;
              continue loop;
            }
          }
        }
      }
    }
  };

  return (0, _Nonempty.rev)()(loop(new _List2.default(), headWidth, 0, 0, 0));
}

const inlineTagRegex = (0, _RegExp.create)("{@[a-z]+.*?[^\\\\]}", 1);

function addPrefixes(prefixes_0, prefixes_1) {
  var prefixes;
  return (0, _CurriedLambda2.default)((prefixes = [prefixes_0, prefixes_1], $var7 => {
    var x_1;
    var x;
    return (0, _Nonempty.mapTail)((x_1 = prefixes[1], function (y_1) {
      return x_1 + y_1;
    }), (0, _Nonempty.mapHead)((x = prefixes[0], function (y) {
      return x + y;
    }), $var7));
  }));
}

function wrap(settings, prefixes, lines) {
  var f;
  const addDoubleSpaces = (0, _Nonempty.mapInit)(function (s) {
    const t = (0, _String.trim)(s, "end");

    if (settings.doubleSentenceSpacing ? [".", "?", "!"].some(function (c) {
      return (0, _String.endsWith)(t, c);
    }) : false) {
      return t + "  ";
    } else {
      return t;
    }
  });

  const freezeInlineTags = function (str) {
    return (0, _RegExp.replace)(inlineTagRegex, str, function (m) {
      return (0, _String.replace)(m[0], " ", "\u0000");
    });
  };

  const unfreezeInlineTags = function (str_1) {
    return (0, _String.replace)(str_1, "\u0000", " ");
  };

  const lineWidths = (f = $var8 => function (s_1) {
    return settings.column - s_1.length;
  }(function (str_2) {
    return (0, _Line.tabsToSpaces)(settings.tabWidth, str_2);
  }($var8)), function (tupledArg) {
    return _Extensions.Tuple.map(f, tupledArg[0], tupledArg[1]);
  })(prefixes);
  return addPrefixes(prefixes[0], prefixes[1])(function (arg10_) {
    return (0, _Nonempty.map)(unfreezeInlineTags, arg10_);
  }(wrapLines(lineWidths[0], lineWidths[1], function (arg10__1) {
    return (0, _Nonempty.map)(freezeInlineTags, arg10__1);
  }(addDoubleSpaces(lines)))));
}