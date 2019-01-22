"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cssMarkers = exports.scriptMarkers = undefined;
exports.regex = regex;
exports.html = html;

var _RegExp = require("../fable-core/RegExp");

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _Parsing = require("./Parsing.Core");

var _Option = require("../fable-core/Option");

var _Extensions = require("./Extensions");

var _Nonempty = require("./Nonempty");

var _Block = require("./Block");

var _List = require("../fable-core/List");

var _Parsing2 = require("./Parsing.Comments");

var _Parsing3 = require("./Parsing.Markdown");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function regex(str) {
  return (0, _RegExp.create)(str, 1);
}

const scriptMarkers = exports.scriptMarkers = [regex("<script"), regex("</script>")];
const cssMarkers = exports.cssMarkers = [regex("<style"), regex("</style>")];

function html(scriptParser, cssParser, settings) {
  const embeddedScript = (0, _CurriedLambda2.default)(function (markers, contentParser) {
    return (0, _Parsing.optionParser)(function (arg10_) {
      return (0, _Parsing.takeLinesBetweenMarkers)(markers[0], markers[1], arg10_);
    }, function (lines) {
      return (0, _Option.defaultArg)((0, _Option.defaultArg)((0, _Option.defaultArg)(_Extensions.List.tryInit((0, _Nonempty.tail)(lines)), null, _Nonempty.fromList), null, $var2 => {
        var head;
        return (head = (0, _Block.ignore)((0, _Nonempty.singleton)((0, _Nonempty.head)(lines))), function (neList) {
          return (0, _Nonempty.cons)(head, neList);
        })(($var1 => {
          var last;
          return (last = (0, _Block.ignore)((0, _Nonempty.singleton)((0, _Nonempty.last)(lines))), function (arg10__1) {
            return (0, _Nonempty.snoc)(last, arg10__1);
          })((0, _CurriedLambda2.default)(contentParser)(settings)($var1));
        })($var2));
      }), (0, _Nonempty.singleton)((0, _Block.ignore)(lines)));
    });
  });
  let otherParsers;
  const parsers = (0, _List.ofArray)([_Parsing.blankLines, (0, _Parsing2.blockComment)((0, _CurriedLambda2.default)(_Parsing3.markdown), "", "", "<!--", "-->", settings), (0, _CurriedLambda2.default)(embeddedScript)(scriptMarkers, scriptParser), (0, _CurriedLambda2.default)(embeddedScript)(cssMarkers, cssParser)]);

  otherParsers = function (lines_1) {
    return (0, _Parsing.tryMany)(parsers, lines_1);
  };

  const paragraphBlocks = $var4 => {
    var fn_1;
    return (fn_1 = function (lines_2) {
      return (0, _Parsing.indentSeparatedParagraphBlock)(function (tupledArg) {
        return (0, _Block.text)(tupledArg[0], tupledArg[1]);
      }, lines_2);
    }, function (arg10__3) {
      return (0, _Nonempty.map)(fn_1, arg10__3);
    })(($var3 => {
      var fn;
      var regex_1;
      return (fn = (0, _Parsing.splitIntoChunks)((0, _Parsing.afterRegex)(regex("\\>\\s*$"))), function (neList_1) {
        return (0, _Nonempty.collect)(fn, neList_1);
      })((0, _Parsing.splitIntoChunks)((regex_1 = regex("^\\s*<"), function (arg10__2) {
        return (0, _Parsing.beforeRegex)(regex_1, arg10__2);
      }))($var3));
    })($var4));
  };

  return (0, _Parsing.repeatToEnd)((0, _Parsing.takeUntil)(otherParsers, paragraphBlocks));
}