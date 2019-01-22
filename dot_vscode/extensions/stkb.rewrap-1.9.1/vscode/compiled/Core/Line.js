"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isBlank = isBlank;
exports.contains = contains;
exports.startsWith = startsWith;
exports.tryMatch = tryMatch;
exports.leadingWhitespace = leadingWhitespace;
exports.containsText = containsText;
exports.split = split;
exports.tabsToSpaces = tabsToSpaces;

var _String2 = require("../fable-core/String");

var _RegExp = require("../fable-core/RegExp");

var _Extensions = require("./Extensions");

var _Option = require("../fable-core/Option");

var _List = require("../fable-core/List");

var _List2 = _interopRequireDefault(_List);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isBlank(l) {
  return (0, _String2.isNullOrWhiteSpace)(l);
}

function contains(regex, line) {
  return (0, _RegExp.isMatch)(regex, line);
}

function startsWith(marker, line) {
  return (0, _RegExp.isMatch)((0, _RegExp.create)("^\\s*" + marker), line);
}

function tryMatch(regex, line) {
  const m = (0, _RegExp.match)(regex, line);

  if (m != null) {
    return _Extensions.String.takeStart(m.index + m[0].length, line);
  } else {
    return null;
  }
}

function leadingWhitespace(line) {
  return (0, _RegExp.match)(leadingWhitespaceRegex, line)[0];
}

function containsText(line) {
  if (contains((0, _RegExp.create)("[A-Za-z0-9À-￿]"), line)) {
    return !contains((0, _RegExp.create)("^=(begin|end)\\s*$"), line);
  } else {
    return false;
  }
}

function split(regex, line) {
  const prefix = (0, _Option.defaultArg)(tryMatch(regex, line), "");
  return [prefix, _Extensions.String.dropStart(prefix.length, line)];
}

function tabsToSpaces(tabSize, str) {
  const matchValue = (0, _List.reverse)((0, _List.ofArray)((0, _String2.split)(str, "\t")));

  if (matchValue.tail != null) {
    return (0, _String2.join)("", (0, _List.reverse)(function (tail) {
      return new _List2.default(matchValue.head, tail);
    }((0, _List.map)(function (s) {
      return (0, _String2.padRight)(s, (~~(s.length / tabSize) + 1) * tabSize);
    }, matchValue.tail))));
  } else {
    return str;
  }
}

const leadingWhitespaceRegex = (0, _RegExp.create)("^\\s*");