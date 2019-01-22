"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.markerRegex = markerRegex;
exports.extractPrefix = extractPrefix;
exports.stripLines = stripLines;
exports.maybeReformat = maybeReformat;
exports.extractWrappable = extractWrappable;
exports.decorationLinesParser = decorationLinesParser;
exports.lineComment = lineComment;
exports.blockComment = blockComment;

var _RegExp = require("../fable-core/RegExp");

var _Line = require("./Line");

var _Option = require("../fable-core/Option");

var _Seq = require("../fable-core/Seq");

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _Extensions = require("./Extensions");

var _String2 = require("../fable-core/String");

var _Nonempty = require("./Nonempty");

var _List = require("../fable-core/List");

var _List2 = _interopRequireDefault(_List);

var _Block = require("./Block");

var _Parsing = require("./Parsing.Core");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function markerRegex(marker) {
  return (0, _RegExp.create)("^\\s*" + marker + "\\s*");
}

function extractPrefix(prefixRegex, defaultPrefix, tabWidth, lines) {
  return function (p) {
    return [p, (0, _Line.tabsToSpaces)(tabWidth, p).length];
  }(function (option) {
    return (0, _Option.defaultArg)(option, defaultPrefix);
  }((0, _Option.defaultArg)((0, _Option.defaultArg)((0, _Seq.tryFind)(_Line.containsText, lines), (0, _Seq.tryHead)(lines)), null, $var1 => function (tuple) {
    return tuple[0];
  }(function (line) {
    return (0, _Line.split)(prefixRegex, line);
  }($var1)))));
}

function stripLines(prefixRegex, prefixLength, tabWidth, eraseIndentedMarker) {
  var stripLine;
  return (0, _CurriedLambda2.default)((stripLine = $var4 => function (tupledArg_1) {
    return tupledArg_1[0] + tupledArg_1[1];
  }(($var3 => {
    var f;
    return (f = function (pre) {
      return eraseIndentedMarker ? function (str_1) {
        return _Extensions.String.dropStart(prefixLength, str_1);
      }((0, _String2.replicate)(pre.length, " ")) : _Extensions.String.dropStart(prefixLength, pre);
    }, function (tupledArg) {
      return _Extensions.Tuple.mapFirst(f, tupledArg[0], tupledArg[1]);
    })(($var2 => function (line) {
      return (0, _Line.split)(prefixRegex, line);
    }(function (str) {
      return (0, _Line.tabsToSpaces)(tabWidth, str);
    }($var2)))($var3));
  })($var4)), function (arg10_) {
    return (0, _Nonempty.map)(stripLine, arg10_);
  }));
}

function maybeReformat(settings, prefix) {
  if (prefix !== "" ? settings.reformat : false) {
    return (0, _String2.trim)(prefix, "end") + " ";
  } else {
    return prefix;
  }
}

function extractWrappable(marker, eraseIndentedMarker, reformatPrefix, settings, lines) {
  const regex = markerRegex(marker);
  const patternInput = extractPrefix(regex, "", settings.tabWidth, (0, _Nonempty.toList)(lines));
  const newPrefix = settings.reformat ? reformatPrefix(patternInput[0]) : patternInput[0];
  return [[newPrefix, newPrefix], stripLines(regex, patternInput[1], settings.tabWidth, eraseIndentedMarker)(lines)];
}

function decorationLinesParser(fn, lines) {
  const loop = function (output, _arg1) {
    loop: while (true) {
      const matchValue = fn(_arg1.data[0]);

      if (matchValue == null) {
        return output;
      } else {
        const matchValue_1 = (0, _Nonempty.fromList)(_arg1.data[1]);

        if (matchValue_1 == null) {
          return new _List2.default((0, _Option.getValue)(matchValue), output);
        } else {
          output = new _List2.default((0, _Option.getValue)(matchValue), output);
          _arg1 = (0, _Option.getValue)(matchValue_1);
          continue loop;
        }
      }
    }
  };

  return (0, _Option.defaultArg)((0, _Nonempty.fromList)(loop(new _List2.default(), lines)), null, function (newLinesRev) {
    return [(0, _Nonempty.singleton)(new _Block.Block(2, (0, _Nonempty.rev)()(newLinesRev))), (0, _Nonempty.fromList)(_Extensions.List.safeSkip((0, _Nonempty.length)()(newLinesRev), (0, _Nonempty.toList)(lines)))];
  });
}

function lineComment(contentParser, marker, settings) {
  const prefixRegex = markerRegex(marker);

  const linesToComment = function (lines) {
    const patternInput = extractPrefix(prefixRegex, "", settings.tabWidth, (0, _Nonempty.toList)(lines));

    const maybeMakeDecLine = function (line) {
      const patternInput_1 = (0, _Line.split)(prefixRegex, line);

      if ((patternInput_1[0] === (0, _String2.trim)(patternInput_1[0], "end") ? patternInput_1[1] !== "" : false) ? !(0, _Line.containsText)(patternInput_1[1]) : false) {
        return (0, _String2.trim)(patternInput[0], "end") + patternInput_1[1];
      } else {
        return null;
      }
    };

    let otherLinesParser;
    const newPrefix = maybeReformat(settings, patternInput[0]);

    otherLinesParser = $var6 => {
      var parser;
      var prefixes;
      return (parser = $var5 => (0, _CurriedLambda2.default)(contentParser)(settings)(stripLines(prefixRegex, patternInput[1], settings.tabWidth, true)($var5)), function (tupledArg) {
        return (0, _Block.splitUp)(parser, tupledArg[0], tupledArg[1]);
      })((prefixes = [newPrefix, newPrefix], function (lines_1) {
        return _Block.WrappableModule.fromLines(prefixes, lines_1);
      })($var6));
    };

    const combinedParser = (0, _Parsing.repeatToEnd)((0, _Parsing.takeUntil)(function (lines_2) {
      return decorationLinesParser(maybeMakeDecLine, lines_2);
    }, otherLinesParser));
    return ($var7 => (0, _Nonempty.singleton)(new _Block.Block(0, $var7)))(combinedParser(lines));
  };

  return (0, _Parsing.optionParser)((0, _Nonempty.span)(function (line_1) {
    return (0, _Line.contains)(prefixRegex, line_1);
  }), linesToComment);
}

function blockComment(contentParser, tailMarker, defaultTailMarker, startMarker, endMarker, settings) {
  const startRegex = markerRegex(startMarker);
  const endRegex = (0, _RegExp.create)(endMarker);

  const linesToComment = function (lines) {
    const patternInput = (0, _Line.split)(startRegex, (0, _Nonempty.head)(lines));
    const prefixRegex = markerRegex(tailMarker);
    const defaultPrefix = (0, _Line.leadingWhitespace)(patternInput[0]) + defaultTailMarker;

    const patternInput_1 = function (lines_1) {
      return extractPrefix(prefixRegex, defaultPrefix, settings.tabWidth, lines_1);
    }((0, _Nonempty.tail)(lines));

    const newPrefix = settings.reformat ? defaultPrefix : patternInput_1[0];

    const maybeMakeHeadDecLine = function (line) {
      if ((line === (0, _Nonempty.head)(lines) ? patternInput[0] === (0, _String2.trim)(patternInput[0], "end") : false) ? !(0, _Line.containsText)(patternInput[1]) : false) {
        return line;
      } else {
        return null;
      }
    };

    const maybeMakeDecLine = function (line_1) {
      const patternInput_2 = (0, _Line.split)(prefixRegex, line_1);
      const leadingWhitespace = (0, _Line.leadingWhitespace)(patternInput_2[0]);
      const indent = (0, _Line.tabsToSpaces)(settings.tabWidth, leadingWhitespace).length | 0;
      const noMarkerWithSpaceAfter = patternInput_2[0] === leadingWhitespace ? true : patternInput_2[0] === (0, _String2.trim)(patternInput_2[0], "end");

      if ((!(0, _Line.containsText)(line_1) ? (0, _String2.trim)(line_1, "both").length > 1 : false) ? noMarkerWithSpaceAfter ? indent < patternInput_1[1] : false : false) {
        return line_1;
      } else {
        return null;
      }
    };

    const maybeMakeEndDecLine = function (line_2) {
      return (0, _Option.defaultArg)((0, _Option.filter)($var8 => !(0, _Line.containsText)($var8), (0, _Line.tryMatch)(endRegex, line_2)), null, function (_arg1) {
        return line_2;
      });
    };

    const stripLine = $var10 => {
      return function (tupledArg) {
        return _Extensions.String.dropStart(patternInput_1[1], tupledArg[0]) + tupledArg[1];
      }(($var9 => function (line_3) {
        return (0, _Line.split)(prefixRegex, line_3);
      }(function (str) {
        return (0, _Line.tabsToSpaces)(settings.tabWidth, str);
      }($var9)))($var10));
    };

    let stdDecLineParser;
    const parsers = (0, _List.ofArray)([function (lines_2) {
      return decorationLinesParser(maybeMakeEndDecLine, lines_2);
    }, function (lines_3) {
      return decorationLinesParser(maybeMakeDecLine, lines_3);
    }]);

    stdDecLineParser = function (lines_4) {
      return (0, _Parsing.tryMany)(parsers, lines_4);
    };

    let stdParser;

    const otherLinesParser = $var12 => {
      var parser;
      return (parser = (0, _CurriedLambda2.default)(contentParser)(settings), function (tupledArg_1) {
        return (0, _Block.splitUp)(parser, tupledArg_1[0], tupledArg_1[1]);
      })(($var11 => {
        var prefixes;
        return (prefixes = [newPrefix, newPrefix], function (lines_5) {
          return _Block.WrappableModule.fromLines(prefixes, lines_5);
        })(function (arg10_) {
          return (0, _Nonempty.map)(stripLine, arg10_);
        }($var11));
      })($var12));
    };

    stdParser = (0, _Parsing.repeatToEnd)((0, _CurriedLambda2.default)(function (totalParser) {
      return (0, _Parsing.takeUntil)(stdDecLineParser, totalParser);
    })(otherLinesParser));

    const beginParser = function (lines_6) {
      const otherLinesParser_1 = $var15 => {
        var parser_1;
        return (parser_1 = (0, _CurriedLambda2.default)(contentParser)(settings), function (tupledArg_2) {
          return (0, _Block.splitUp)(parser_1, tupledArg_2[0], tupledArg_2[1]);
        })(($var14 => {
          var prefixes_1;
          return (prefixes_1 = [maybeReformat(settings, patternInput[0]), newPrefix], function (lines_7) {
            return _Block.WrappableModule.fromLines(prefixes_1, lines_7);
          })(($var13 => {
            var fn;
            return function (arg10__2) {
              return (0, _Nonempty.mapTail)(stripLine, arg10__2);
            }((fn = function (_arg2) {
              return patternInput[1];
            }, function (arg10__1) {
              return (0, _Nonempty.mapHead)(fn, arg10__1);
            })($var13));
          })($var14));
        })($var15));
      };

      return (0, _Option.defaultArgWith)(decorationLinesParser(maybeMakeHeadDecLine, lines_6), function () {
        return (0, _Parsing.takeUntil)(stdDecLineParser, otherLinesParser_1)(lines_6);
      });
    };

    let blocks;
    const matchValue = beginParser(lines);

    if (matchValue[1] == null) {
      blocks = matchValue[0];
    } else {
      const remainingLines = (0, _Option.getValue)(matchValue[1]);
      blocks = _Nonempty.Nonempty.op_Addition(matchValue[0], stdParser(remainingLines));
    }

    return (0, _Nonempty.singleton)(new _Block.Block(0, blocks));
  };

  return (0, _Parsing.optionParser)(function (arg10__3) {
    return (0, _Parsing.takeLinesBetweenMarkers)(startRegex, endRegex, arg10__3);
  }, linesToComment);
}