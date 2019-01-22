"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParseResult = undefined;
exports.wrapSelected = wrapSelected;

var _Symbol2 = require("../fable-core/Symbol");

var _Symbol3 = _interopRequireDefault(_Symbol2);

var _Util = require("../fable-core/Util");

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _List = require("../fable-core/List");

var _List2 = _interopRequireDefault(_List);

var _Option = require("../fable-core/Option");

var _Nonempty = require("./Nonempty");

var _Block = require("./Block");

var _Extensions = require("./Extensions");

var _Wrapping = require("./Wrapping");

var _Seq = require("../fable-core/Seq");

var _Types = require("./Types");

var _Array = require("../fable-core/Array");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LineRange {
  [_Symbol3.default.reflection]() {
    return {
      type: "Selections.LineRange",
      interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
      properties: {
        s: "number",
        e: "number"
      }
    };
  }

  Equals(other) {
    return (0, _Util.equalsRecords)(this, other);
  }

  CompareTo(other) {
    return (0, _Util.compareRecords)(this, other) | 0;
  }

  constructor(s, e) {
    this.s = s | 0;
    this.e = e | 0;
  }

  get startLine() {
    return this.s;
  }

  get endLine() {
    return this.e;
  }

  get length() {
    return this.endLine - this.startLine + 1 > 0 ? this.endLine - this.startLine + 1 : 0;
  }

  get isEmpty() {
    return this.endLine < this.startLine;
  }

  static fromStartEnd(startLine, endLine) {
    return new LineRange(startLine, endLine);
  }

  static fromStartLength(startLine, length) {
    return new LineRange(startLine, startLine + length - 1);
  }

  static fromSelection(s) {
    const startLine = (s.active.line < s.anchor.line ? s.active.line : s.anchor.line) | 0;
    const endLine = (s.active.line > s.anchor.line ? s.active.line : s.anchor.line) | 0;
    const isEmpty = startLine === endLine ? s.anchor.character === s.active.character : false;

    if (isEmpty) {
      return new LineRange(startLine, startLine - 1);
    } else if (s.active.line > s.anchor.line ? s.active.character === 0 : false) {
      return new LineRange(s.anchor.line, s.active.line - 1);
    } else if (s.anchor.line > s.active.line ? s.anchor.character === 0 : false) {
      return new LineRange(s.active.line, s.anchor.line - 1);
    } else {
      return new LineRange(startLine, endLine);
    }
  }

  get shiftStartDown() {
    return this.endLine > this.startLine ? new LineRange(this.startLine + 1, this.endLine) : null;
  }

  get shiftEndUp() {
    return this.endLine > this.startLine ? new LineRange(this.startLine, this.endLine - 1) : null;
  }

}

(0, _Symbol2.setType)("Selections.LineRange", LineRange);

function intersects(r1, r2) {
  intersects: while (true) {
    if (r2.isEmpty) {
      const $var5 = r2;
      r2 = r1;
      r1 = $var5;
      continue intersects;
    } else if (r1.isEmpty) {
      if (r1.startLine >= r2.startLine) {
        return r1.startLine <= r2.endLine;
      } else {
        return false;
      }
    } else {
      return (r1.startLine > r2.startLine ? r1.startLine : r2.startLine) <= (r1.endLine < r2.endLine ? r1.endLine : r2.endLine);
    }
  }
}

const normalizeRanges = (0, _CurriedLambda2.default)((() => {
  const loop = function (output, input) {
    loop: while (true) {
      if (input.tail != null) {
        if (input.tail.tail != null) {
          if (input.head.endLine === input.tail.head.startLine) {
            if (input.head.isEmpty ? input.tail.head.isEmpty : false) {
              output = output;
              input = new _List2.default(input.tail.head, input.tail.tail);
              continue loop;
            } else if (input.head.isEmpty) {
              const matchValue = input.tail.head.shiftStartDown;

              if (matchValue != null) {
                output = new _List2.default(input.head, output);
                input = new _List2.default((0, _Option.getValue)(matchValue), input.tail.tail);
                continue loop;
              } else {
                output = new _List2.default(input.head, output);
                input = input.tail.tail;
                continue loop;
              }
            } else if (input.tail.head.isEmpty) {
              const matchValue_1 = input.head.shiftEndUp;

              if (matchValue_1 != null) {
                output = new _List2.default((0, _Option.getValue)(matchValue_1), output);
                input = new _List2.default(input.tail.head, input.tail.tail);
                continue loop;
              } else {
                output = output;
                input = new _List2.default(input.tail.head, input.tail.tail);
                continue loop;
              }
            } else {
              output = output;
              input = new _List2.default(LineRange.fromStartEnd.bind(LineRange)(input.head.startLine, input.tail.head.endLine), input.tail.tail);
              continue loop;
            }
          } else {
            output = new _List2.default(input.head, output);
            input = new _List2.default(input.tail.head, input.tail.tail);
            continue loop;
          }
        } else {
          return new _List2.default(input.head, output);
        }
      } else {
        return output;
      }
    }
  };

  return $var1 => (0, _List.reverse)((0, _CurriedLambda2.default)(loop)(new _List2.default())($var1));
})());

class ParseResult {
  constructor(startLine, originalLines, blocks) {
    this.startLine = startLine | 0;
    this.originalLines = originalLines;
    this.blocks = blocks;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Selections.ParseResult",
      interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
      properties: {
        startLine: "number",
        originalLines: (0, _Util.makeGeneric)(_Nonempty.Nonempty, {
          T: "string"
        }),
        blocks: (0, _Util.makeGeneric)(_Nonempty.Nonempty, {
          T: _Block.Block
        })
      }
    };
  }

  Equals(other) {
    return (0, _Util.equalsRecords)(this, other);
  }

  CompareTo(other) {
    return (0, _Util.compareRecords)(this, other) | 0;
  }

}

exports.ParseResult = ParseResult;
(0, _Symbol2.setType)("Selections.ParseResult", ParseResult);

function processBlocks(settings, selections, parseResult) {
  const splitBlock = function (n, block) {
    var f;
    var mapping;
    var f_1;
    var f_2;
    var mapping_1;
    var f_3;

    if (block.tag === 2) {
      return (f = (mapping = function (arg0) {
        return new _Block.Block(2, arg0);
      }, function (option) {
        return (0, _Option.defaultArg)(option, null, mapping);
      }), function (tupledArg) {
        return _Extensions.Tuple.mapSecond(f, tupledArg[0], tupledArg[1]);
      })((f_1 = function (arg0_1) {
        return new _Block.Block(2, arg0_1);
      }, function (tupledArg_1) {
        return _Extensions.Tuple.mapFirst(f_1, tupledArg_1[0], tupledArg_1[1]);
      })((0, _Nonempty.splitAt)(n, block.data)));
    } else if (block.tag === 0) {
      throw new Error("Not going to split a comment");
    } else {
      const pTail = block.data[0][1];
      const pHead = block.data[0][0];
      const lines = block.data[1];
      return (f_2 = (mapping_1 = function (ls) {
        return new _Block.Block(1, [[pTail, pTail], ls]);
      }, function (option_1) {
        return (0, _Option.defaultArg)(option_1, null, mapping_1);
      }), function (tupledArg_2) {
        return _Extensions.Tuple.mapSecond(f_2, tupledArg_2[0], tupledArg_2[1]);
      })((f_3 = function (ls_1) {
        return new _Block.Block(1, [[pHead, pTail], ls_1]);
      }, function (tupledArg_3) {
        return _Extensions.Tuple.mapFirst(f_3, tupledArg_3[0], tupledArg_3[1]);
      })((0, _Nonempty.splitAt)(n, lines)));
    }
  };

  const processWholeBlock = function (block_1) {
    if (block_1.tag === 2) {
      return block_1.data;
    } else if (block_1.tag === 0) {
      return (0, _Nonempty.collect)(processWholeBlock, block_1.data);
    } else {
      return (0, _Wrapping.wrap)(settings, block_1.data[0], block_1.data[1]);
    }
  };

  const loop = function (output, sels, start, _arg1, origLines) {
    var f_4;

    loop: while (true) {
      const blockLength = (0, _Block.length)(_arg1.data[0]) | 0;
      const selsTouching = (0, _List.filter)(function (s) {
        return s.startLine < start + blockLength;
      }, sels);
      const hasEmptySelection = (0, _Seq.exists)(function (s_1) {
        return s_1.isEmpty;
      }, selsTouching);
      let patternInput_1;
      const matchValue = (0, _Seq.tryHead)(selsTouching);

      if (matchValue != null) {
        const $var2 = _arg1.data[0].tag === 2 ? [0] : _arg1.data[0].tag === 0 ? [1] : [0];

        switch ($var2[0]) {
          case 0:
            if (hasEmptySelection) {
              patternInput_1 = [processWholeBlock(_arg1.data[0]), null];
            } else {
              const patternInput = (0, _Option.getValue)(matchValue).startLine > start ? [(0, _Option.getValue)(matchValue).startLine - start, function (_arg1_1) {
                return null;
              }] : [(0, _Option.getValue)(matchValue).endLine - start + 1, $var3 => function (arg0_2) {
                return arg0_2;
              }(processWholeBlock($var3))];

              patternInput_1 = function (tupledArg_4) {
                return _Extensions.Tuple.mapFirst(patternInput[1], tupledArg_4[0], tupledArg_4[1]);
              }(splitBlock(patternInput[0], _arg1.data[0]));
            }

            break;

          case 1:
            if (hasEmptySelection ? settings.wholeComment : false) {
              patternInput_1 = [processWholeBlock(_arg1.data[0]), null];
            } else {
              patternInput_1 = [processBlocks(settings, sels, new ParseResult(start, origLines, _arg1.data[0].data)), null];
            }

            break;
        }
      } else {
        patternInput_1 = [null, null];
      }

      const patternInput_2 = patternInput_1[1] == null ? [blockLength, _arg1.data[1]] : [blockLength - (0, _Block.length)((0, _Option.getValue)(patternInput_1[1])), new _List2.default((0, _Option.getValue)(patternInput_1[1]), _arg1.data[1])];
      const patternInput_3 = (f_4 = function (oL) {
        return (0, _Option.defaultArg)(patternInput_1[0], oL);
      }, function (tupledArg_5) {
        return _Extensions.Tuple.mapFirst(f_4, tupledArg_5[0], tupledArg_5[1]);
      })((0, _Nonempty.splitAt)(patternInput_2[0], origLines));

      const nextOutput = function (_arg2) {
        return new _Nonempty.Nonempty(0, [_arg2.data[0], (0, _List.append)(_arg2.data[1], output)]);
      }((0, _Nonempty.rev)()(patternInput_3[0]));

      const matchValue_1 = (0, _Nonempty.fromList)(patternInput_2[1]);

      if (matchValue_1 == null) {
        return (0, _Nonempty.rev)()(nextOutput);
      } else {
        const nextStart = start + patternInput_2[0] | 0;
        const nextSels = (0, _Seq.toList)((0, _Seq.skipWhile)(function (s_2) {
          return s_2.endLine < nextStart ? !(s_2.isEmpty ? s_2.startLine >= nextStart : false) : false;
        }, sels));
        output = (0, _Nonempty.toList)(nextOutput);
        sels = nextSels;
        start = nextStart;
        _arg1 = (0, _Option.getValue)(matchValue_1);
        origLines = (0, _Option.getValue)(patternInput_3[1]);
        continue loop;
      }
    }
  };

  return loop(new _List2.default(), selections, parseResult.startLine, parseResult.blocks, parseResult.originalLines);
}

function trimEdit(originalLines, edit) {
  const editNotZeroLength = function (x) {
    if (edit.endLine - edit.startLine > x) {
      return edit.lines.length > x;
    } else {
      return false;
    }
  };

  const originalLinesArray = Array.from((0, _Nonempty.toList)(originalLines));
  let s = 0;

  while (editNotZeroLength(s) ? originalLinesArray[edit.startLine + s] === edit.lines[s] : false) {
    s = s + 1 | 0;
  }

  let e = 0;

  while (editNotZeroLength(s + e) ? originalLinesArray[edit.endLine - e] === edit.lines[edit.lines.length - e - 1] : false) {
    e = e + 1 | 0;
  }

  return new _Types.Edit(edit.startLine + s, edit.endLine - e, function (array) {
    return array.slice(s);
  }(edit.lines).slice(0, edit.lines.length - s - e), edit.selections);
}

function wrapSelected(originalLines, selections, settings, blocks) {
  const selectionRanges = ($var4 => normalizeRanges((0, _List.ofArray)($var4)))((0, _Array.map)(LineRange.fromSelection.bind(LineRange), selections, Array));

  const parseResult = new ParseResult(0, originalLines, blocks);
  const newLines = Array.from((0, _Nonempty.toList)(processBlocks(settings, selectionRanges, parseResult)));
  return function (edit) {
    return trimEdit(originalLines, edit);
  }(new _Types.Edit(0, (0, _Nonempty.length)()(originalLines) - 1, newLines, selections));
}