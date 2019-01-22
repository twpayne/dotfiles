"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.commandRegex = exports.preserveShortcuts = exports.preserveEnvironments = exports.blockCommands = exports.newlineRegex = undefined;
exports.takeFrom2ndLineUntil = takeFrom2ndLineUntil;
exports.findPreserveSection = findPreserveSection;
exports.latex = latex;

var _RegExp = require("../fable-core/RegExp");

var _Seq = require("../fable-core/Seq");

var _Nonempty = require("./Nonempty");

var _Option = require("../fable-core/Option");

var _Extensions = require("./Extensions");

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _String2 = require("../fable-core/String");

var _List = require("../fable-core/List");

var _List2 = _interopRequireDefault(_List);

var _Block = require("./Block");

var _Util = require("../fable-core/Util");

var _Parsing = require("./Parsing.Core");

var _Parsing2 = require("./Parsing.Comments");

var _Parsing3 = require("./Parsing.Markdown");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const newlineRegex = exports.newlineRegex = (0, _RegExp.create)("\\\\(\\\\\\*?|hline|newline|break|linebreak)(\\[.*?\\])?(\\{.*?\\})?\\s*$");
const blockCommands = exports.blockCommands = ["[", "begin", "item"];
const preserveEnvironments = exports.preserveEnvironments = Array.from((0, _Seq.collect)(function (x) {
  return [x, x + "*"];
}, ["align", "alltt", "displaymath", "equation", "gather", "listing", "lstlisting", "math", "multline", "verbatim"]));
const preserveShortcuts = exports.preserveShortcuts = ["\\(", "\\[", "$", "$$"];

function takeFrom2ndLineUntil(otherParser, parser, _arg1) {
  const bufferToBlocks = $var1 => {
    return parser((0, _Nonempty.rev)()($var1));
  };

  const loopFrom2ndLine = function (buffer, lines) {
    var f;
    var arg00_;

    loopFrom2ndLine: while (true) {
      const matchValue = (0, _Nonempty.fromList)(lines);

      if (matchValue != null) {
        const tail = (0, _Option.getValue)(matchValue).data[1];
        const head = (0, _Option.getValue)(matchValue).data[0];
        const matchValue_1 = otherParser((0, _Option.getValue)(matchValue));

        if (matchValue_1 != null) {
          return (f = (arg00_ = bufferToBlocks(buffer), function (b) {
            return (0, _Nonempty.append)(arg00_, b);
          }), function (tupledArg) {
            return _Extensions.Tuple.mapFirst(f, tupledArg[0], tupledArg[1]);
          })((0, _Option.getValue)(matchValue_1));
        } else {
          buffer = (0, _Nonempty.cons)(head, buffer);
          lines = tail;
          continue loopFrom2ndLine;
        }
      } else {
        return [bufferToBlocks(buffer), null];
      }
    }
  };

  return loopFrom2ndLine((0, _Nonempty.singleton)(_arg1.data[0]), _arg1.data[1]);
}

const commandRegex = exports.commandRegex = (0, _RegExp.create)("^\\\\(\\[|[a-z]+)\\*?\\s*(?:\\[[^\\]]*\\]\\s*)?(?:\\{([a-z]+\\*?))?(?:.*\\})?");

function findPreserveSection(beginMarker) {
  var endMarker;
  var checkLine;
  var loop;
  return (0, _CurriedLambda2.default)((endMarker = (beginMarker === "$" ? true : beginMarker === "$$") ? beginMarker : beginMarker === "\\(" ? "\\)" : beginMarker === "\\[" ? "\\]" : "\\end{" + beginMarker + "}", checkLine = function (line, offset) {
    const p = line.indexOf(endMarker, offset) | 0;

    if (p < 0) {
      return false;
    } else if (p === 0 ? true : (0, _String2.getCharAtIndex)(line, p - 1) !== "\\") {
      return true;
    } else {
      return checkLine(line, p + 1);
    }
  }, loop = function (acc, lines) {
    return lines.tail != null ? checkLine(lines.head, 0) ? [(0, _List.reverse)(new _List2.default(lines.head, acc)), lines.tail] : loop(new _List2.default(lines.head, acc), lines.tail) : [(0, _List.reverse)(acc), new _List2.default()];
  }, function (_arg1) {
    const patternInput = loop(new _List2.default(), _arg1.data[1]);
    return [(0, _Nonempty.singleton)(new _Block.Block(2, new _Nonempty.Nonempty(0, [_arg1.data[0], patternInput[0]]))), (0, _Nonempty.fromList)(patternInput[1])];
  }));
}

function latex(settings) {
  const command = function (_arg1) {
    const trimmedLine = _Extensions.String.trim(_arg1.data[0]);

    const cmdMatch = (0, _RegExp.match)(commandRegex, trimmedLine);
    const patternInput = cmdMatch != null ? [cmdMatch[1] || "", cmdMatch[2] || "", cmdMatch[0].length === trimmedLine.length] : ["", "", false];

    if ((0, _Seq.exists)($var2 => (0, _Util.equals)(trimmedLine, $var2), preserveShortcuts)) {
      return findPreserveSection(trimmedLine)(_arg1);
    } else if (patternInput[0] === "begin" ? (0, _Seq.exists)($var3 => (0, _Util.equals)(patternInput[1], $var3), preserveEnvironments) : false) {
      return findPreserveSection(patternInput[1])(_arg1);
    } else if (patternInput[2]) {
      return [(0, _Nonempty.singleton)(new _Block.Block(2, new _Nonempty.Nonempty(0, [_arg1.data[0], new _List2.default()]))), (0, _Nonempty.fromList)(_arg1.data[1])];
    } else if (trimmedLine.indexOf("$$") === 0 ? true : (0, _Seq.exists)($var4 => (0, _Util.equals)(patternInput[0], $var4), blockCommands)) {
      return takeFrom2ndLineUntil(otherParsers, plainText, _arg1);
    } else {
      return null;
    }
  };

  const plainText = $var5 => {
    var fn;
    return (fn = function (arg10_) {
      return (0, _Parsing.firstLineIndentParagraphBlock)(settings.reformat, arg10_);
    }, function (arg10__1) {
      return (0, _Nonempty.map)(fn, arg10__1);
    })((0, _Parsing.splitIntoChunks)((0, _Parsing.afterRegex)(newlineRegex))($var5));
  };

  let otherParsers;
  const parsers = (0, _List.ofArray)([_Parsing.blankLines, (0, _Parsing2.lineComment)((0, _CurriedLambda2.default)(_Parsing3.markdown), "%", settings), command]);

  otherParsers = function (lines) {
    return (0, _Parsing.tryMany)(parsers, lines);
  };

  return (0, _Parsing.repeatToEnd)((0, _Parsing.takeUntil)(otherParsers, plainText));
}