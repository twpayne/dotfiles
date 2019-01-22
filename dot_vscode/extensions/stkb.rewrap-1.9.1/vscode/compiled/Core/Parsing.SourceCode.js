"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.html = exports.css = exports.java = exports.javadocMarkers = exports.cBlock = exports.cLine = exports.block = exports.customBlock = exports.line = exports.customLine = undefined;
exports.sourceCode = sourceCode;

var _List = require("../fable-core/List");

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _Parsing = require("./Parsing.Core");

var _Nonempty = require("./Nonempty");

var _Block = require("./Block");

var _Parsing2 = require("./Parsing.Comments");

var _Parsing3 = require("./Parsing.Markdown");

var _Parsing4 = require("./Parsing.DocComments");

var _Parsing5 = require("./Parsing.Html");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sourceCode(commentParsers, settings) {
  let commentParsers_1;
  const parsers = (0, _List.map)((0, _CurriedLambda2.default)(function (cp) {
    return (0, _CurriedLambda2.default)(cp)(settings);
  }), commentParsers);

  commentParsers_1 = function (lines) {
    return (0, _Parsing.tryMany)(parsers, lines);
  };

  const codeParser = $var1 => {
    return (0, _Nonempty.singleton)((0, _Block.ignore)($var1));
  };

  return (0, _Parsing.repeatToEnd)((0, _Parsing.takeUntil)(commentParsers_1, codeParser));
}

const customLine = exports.customLine = (0, _CurriedLambda2.default)((0, _CurriedLambda2.default)(_Parsing2.lineComment));
const line = exports.line = (0, _CurriedLambda2.default)((0, _CurriedLambda2.default)(customLine)((0, _CurriedLambda2.default)(_Parsing3.markdown)));
const customBlock = exports.customBlock = (0, _CurriedLambda2.default)((0, _CurriedLambda2.default)(function (contentParser, tupledArg, tupledArg_1, settings) {
  return (0, _Parsing2.blockComment)(contentParser, tupledArg[0], tupledArg[1], tupledArg_1[0], tupledArg_1[1], settings);
}));
const block = exports.block = (0, _CurriedLambda2.default)((0, _CurriedLambda2.default)(customBlock)((0, _CurriedLambda2.default)(_Parsing3.markdown), ["", ""]));
const cLine = exports.cLine = (0, _CurriedLambda2.default)((0, _CurriedLambda2.default)(line)("//"));
const cBlock = exports.cBlock = (0, _CurriedLambda2.default)((0, _CurriedLambda2.default)(customBlock)((0, _CurriedLambda2.default)(_Parsing3.markdown), ["\\*?", ""], ["/\\*", "\\*/"]));
const javadocMarkers = exports.javadocMarkers = ["/\\*[*!]", "\\*/"];
const java = exports.java = (0, _CurriedLambda2.default)((() => {
  const commentParsers = (0, _List.ofArray)([(0, _CurriedLambda2.default)(customBlock)(_Parsing4.javadoc, ["\\*?", " * "], javadocMarkers), cBlock, (0, _CurriedLambda2.default)(customLine)(_Parsing4.javadoc, "//[/!]"), cLine]);
  return (0, _CurriedLambda2.default)(function (settings) {
    return sourceCode(commentParsers, settings);
  });
})());
const css = exports.css = (0, _CurriedLambda2.default)((() => {
  const commentParsers = (0, _List.ofArray)([(0, _CurriedLambda2.default)(customBlock)(_Parsing4.javadoc, ["\\*?", " * "], javadocMarkers), cBlock]);
  return (0, _CurriedLambda2.default)(function (settings) {
    return sourceCode(commentParsers, settings);
  });
})());
const html = exports.html = (0, _CurriedLambda2.default)((0, _CurriedLambda2.default)(function (settings) {
  return (0, _Parsing5.html)(java, css, settings);
}));