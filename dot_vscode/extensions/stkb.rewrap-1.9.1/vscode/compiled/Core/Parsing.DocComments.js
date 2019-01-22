"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ddoc = exports.psdoc = exports.dartdoc = exports.javadoc = undefined;
exports.splitBeforeTags = splitBeforeTags;
exports.ignoreFirstLine = ignoreFirstLine;
exports.godoc = godoc;

var _Nonempty = require("./Nonempty");

var _Option = require("../fable-core/Option");

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _Parsing = require("./Parsing.Markdown");

var _RegExp = require("../fable-core/RegExp");

var _Block = require("./Block");

var _Line = require("./Line");

var _Parsing2 = require("./Parsing.Comments");

var _Parsing3 = require("./Parsing.Core");

var _List = require("../fable-core/List");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function splitBeforeTags(regex, sectionParser, settings, _arg1) {
  const prependRev = function (_arg2, maybeRest) {
    prependRev: while (true) {
      const nextRest = maybeRest == null ? (0, _Nonempty.singleton)(_arg2.data[0]) : (0, _Nonempty.cons)(_arg2.data[0], (0, _Option.getValue)(maybeRest));
      const matchValue = (0, _Nonempty.fromList)(_arg2.data[1]);

      if (matchValue == null) {
        return nextRest;
      } else {
        _arg2 = (0, _Option.getValue)(matchValue);
        maybeRest = nextRest;
        continue prependRev;
      }
    }
  };

  const loop = function (tagMatch, buffer, maybeOutput, lines) {
    loop: while (true) {
      const parser = tagMatch != null ? (0, _CurriedLambda2.default)(sectionParser)(tagMatch) : (0, _CurriedLambda2.default)(_Parsing.markdown);

      const addBufferToOutput = function () {
        return prependRev(parser(settings, (0, _Nonempty.rev)()(buffer)), maybeOutput);
      };

      if (lines.tail == null) {
        return (0, _Nonempty.rev)()(addBufferToOutput());
      } else {
        const m = (0, _RegExp.match)(regex, lines.head);
        const patternInput = m != null ? [m, (0, _Nonempty.singleton)(lines.head), addBufferToOutput()] : [tagMatch, (0, _Nonempty.cons)(lines.head, buffer), maybeOutput];
        tagMatch = patternInput[0];
        buffer = patternInput[1];
        maybeOutput = patternInput[2];
        lines = lines.tail;
        continue loop;
      }
    }
  };

  return loop((0, _RegExp.match)(regex, _arg1.data[0]), (0, _Nonempty.singleton)(_arg1.data[0]), null, _arg1.data[1]);
}

function ignoreFirstLine(otherParser, settings, _arg1) {
  const headBlock = (0, _Block.ignore)((0, _Nonempty.singleton)(_arg1.data[0]));
  return (0, _Option.defaultArg)((0, _Option.defaultArg)((0, _Nonempty.fromList)(_arg1.data[1]), null, $var1 => function (neList) {
    return (0, _Nonempty.cons)(headBlock, neList);
  }((0, _CurriedLambda2.default)(otherParser)(settings)($var1))), (0, _Nonempty.singleton)(headBlock));
}

const javadoc = exports.javadoc = (0, _CurriedLambda2.default)((() => {
  const tagRegex = (0, _RegExp.create)("^\\s*@(\\w+)(.*)$");
  const sectionParser = (0, _CurriedLambda2.default)(function (m) {
    return (0, _Line.isBlank)(m[2] || "") ? (m[1] || "").toLocaleLowerCase() === "example" ? function (_arg1) {
      return $var2 => (0, _Nonempty.singleton)((0, _Block.ignore)($var2));
    } : function (settings, arg20_) {
      return ignoreFirstLine(($var3, $var4) => (0, _Parsing.markdown)($var3)($var4), settings, arg20_);
    } : _Parsing.markdown;
  });
  return function (settings_3, arg30_) {
    return splitBeforeTags(tagRegex, sectionParser, settings_3, arg30_);
  };
})());
const dartdoc = exports.dartdoc = (0, _CurriedLambda2.default)((() => {
  const tagRegex = (0, _RegExp.create)("^\\s*(@nodoc|{@template|{@endtemplate|{@macro)");

  const sectionParser = function (_arg1, settings, arg20_) {
    return ignoreFirstLine((0, _CurriedLambda2.default)(_Parsing.markdown), settings, arg20_);
  };

  return function (settings_2, arg30_) {
    return splitBeforeTags(tagRegex, sectionParser, settings_2, arg30_);
  };
})());
const psdoc = exports.psdoc = (0, _CurriedLambda2.default)((() => {
  const tagRegex = (0, _RegExp.create)("^\\s*\\.([A-Z]+)");
  const codeLineRegex = (0, _RegExp.create)("^\\s*PS C:\\\\>");

  const exampleSection = function (settings, lines) {
    let trimmedExampleSection;
    let otherParser;

    const sectionParser = function (_arg1, settings_1, arg20_) {
      return ignoreFirstLine((0, _CurriedLambda2.default)(_Parsing.markdown), settings_1, arg20_);
    };

    otherParser = function (settings_3, arg30_) {
      return splitBeforeTags(codeLineRegex, sectionParser, settings_3, arg30_);
    };

    trimmedExampleSection = function (settings_4, arg20__1) {
      return ignoreFirstLine(otherParser, settings_4, arg20__1);
    };

    const matchValue = (0, _Nonempty.span)(_Line.isBlank)(lines);

    if (matchValue == null) {
      return trimmedExampleSection(settings, lines);
    } else if ((0, _Option.getValue)(matchValue)[1] != null) {
      return (0, _Nonempty.cons)((0, _Block.ignore)((0, _Option.getValue)(matchValue)[0]), trimmedExampleSection(settings, (0, _Option.getValue)((0, _Option.getValue)(matchValue)[1])));
    } else {
      return (0, _Nonempty.singleton)((0, _Block.ignore)((0, _Option.getValue)(matchValue)[0]));
    }
  };

  const sectionParser_1 = (0, _CurriedLambda2.default)(function (m) {
    if ((m[1] || "") === "EXAMPLE") {
      return function (settings_5, arg20__2) {
        return ignoreFirstLine(exampleSection, settings_5, arg20__2);
      };
    } else {
      const otherParser_1 = function (settings_6) {
        return $var5 => {
          var parser;
          var reformatPrefix;
          return (parser = (0, _Parsing.markdown)(settings_6), function (tupledArg) {
            return (0, _Block.splitUp)(parser, tupledArg[0], tupledArg[1]);
          })((reformatPrefix = function (_arg2) {
            return "  ";
          }, function (lines_1) {
            return (0, _Parsing2.extractWrappable)("", false, reformatPrefix, settings_6, lines_1);
          })($var5));
        };
      };

      return function (settings_7, arg20__3) {
        return ignoreFirstLine(($var6, $var7) => otherParser_1($var6)($var7), settings_7, arg20__3);
      };
    }
  });
  return function (settings_8, arg30__1) {
    return splitBeforeTags(tagRegex, sectionParser_1, settings_8, arg30__1);
  };
})());
const ddoc = exports.ddoc = (0, _CurriedLambda2.default)((0, _CurriedLambda2.default)(_Parsing.markdown));

function godoc(settings) {
  var parsers;
  const indentedLines = (0, _Parsing3.ignoreParser)((0, _Nonempty.span)(function (line) {
    return line[0] === " " ? true : line[0] === "\t";
  }));

  const textLines = $var9 => {
    var prefixes;
    return ($var8 => (0, _Nonempty.singleton)(new _Block.Block(1, $var8)))((prefixes = ["", ""], function (lines) {
      return _Block.WrappableModule.fromLines(prefixes, lines);
    })($var9));
  };

  return (0, _Parsing3.repeatToEnd)((0, _Parsing3.takeUntil)((parsers = (0, _List.ofArray)([_Parsing3.blankLines, indentedLines]), function (lines_1) {
    return (0, _Parsing3.tryMany)(parsers, lines_1);
  }), textLines));
}