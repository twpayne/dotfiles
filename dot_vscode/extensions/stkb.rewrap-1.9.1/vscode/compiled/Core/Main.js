"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.languages = undefined;
exports.getWrappingColumn = getWrappingColumn;
exports.maybeChangeWrappingColumn = maybeChangeWrappingColumn;
exports.saveDocState = saveDocState;
exports.findLanguage = findLanguage;
exports.rewrap = rewrap;
exports.strWidth = strWidth;
exports.maybeAutoWrap = maybeAutoWrap;

var _Types = require("./Types");

var _Util = require("../fable-core/Util");

var _Option = require("../fable-core/Option");

var _Seq = require("../fable-core/Seq");

var _Parsing = require("./Parsing.Documents");

var _Array = require("../fable-core/Array");

var _Nonempty = require("./Nonempty");

var _Selections = require("./Selections");

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _Wrapping = require("./Wrapping");

var _String2 = require("../fable-core/String");

var _Extensions = require("./Extensions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let lastDocState = (0, _Util.createAtom)(new _Types.DocState("", 0, []));
const docWrappingColumns = new Map();

function getWrappingColumn(filePath, rulers) {
  if (!docWrappingColumns.has(filePath)) {
    docWrappingColumns.set(filePath, (0, _Option.defaultArg)((0, _Seq.tryHead)(rulers), 80));
  }

  return docWrappingColumns.get(filePath) | 0;
}

function maybeChangeWrappingColumn(docState, rulers) {
  var x;

  if (!docWrappingColumns.has(docState.filePath)) {
    return getWrappingColumn(docState.filePath, rulers) | 0;
  } else {
    if (docState.Equals(lastDocState())) {
      const nextRulerIndex = (0, _Option.defaultArg)((0, _Option.defaultArg)((0, _Seq.tryFindIndex)((x = docWrappingColumns.get(docState.filePath) | 0, function (y) {
        return x === y;
      }), rulers), null, function (i) {
        return (i + 1) % rulers.length;
      }), 0) | 0;
      docWrappingColumns.set(docState.filePath, rulers[nextRulerIndex]);
    }

    return docWrappingColumns.get(docState.filePath) | 0;
  }
}

function saveDocState(docState) {
  return lastDocState(docState);
}

function findLanguage(name, filePath) {
  return (0, _Option.defaultArg)((0, _Option.defaultArg)((0, _Parsing.findLanguage)(name, filePath), null, function (l) {
    return l.name;
  }), null);
}

const languages = exports.languages = (0, _Array.map)(function (l) {
  return l.name;
}, _Parsing.languages, Array);

function rewrap(file, settings, selections, getLine) {
  const parser = (0, _Parsing.select)(file.language, file.path);
  const linesList = (0, _Nonempty.fromListUnsafe)((0, _Seq.toList)((0, _Seq.unfold)(function (i) {
    return (0, _Option.defaultArg)(getLine(i), null, function (l) {
      return [l, i + 1];
    });
  }, 0)));
  return function (blocks) {
    return (0, _Selections.wrapSelected)(linesList, selections, settings, blocks);
  }((0, _CurriedLambda2.default)(parser)(settings)(linesList));
}

function strWidth(usTabSize, str) {
  const tabSize = (usTabSize > 1 ? usTabSize : 1) | 0;

  const loop = function (acc, i) {
    loop: while (true) {
      if (i >= str.length) {
        return acc | 0;
      } else {
        acc = acc + (0, _Wrapping.charWidthEx)(tabSize, i, str[i].charCodeAt(0));
        i = i + 1;
        continue loop;
      }
    }
  };

  return loop(0, 0) | 0;
}

function maybeAutoWrap(file, settings, newText, pos, getLine) {
  const noEdit = new _Types.Edit(0, 0, [], []);

  if ((0, _String2.isNullOrEmpty)(newText)) {
    return noEdit;
  } else if (!(0, _String2.isNullOrWhiteSpace)(newText)) {
    return noEdit;
  } else {
    let patternInput;
    const matchValue = newText[0];

    if (matchValue === "\n") {
      patternInput = [true, newText.substr(1)];
    } else if (matchValue === "\r") {
      patternInput = [true, newText.substr(2)];
    } else {
      patternInput = [false, ""];
    }

    if (!patternInput[0] ? newText.length > 1 : false) {
      return noEdit;
    } else {
      const patternInput_1 = [pos.line, pos.character + (patternInput[0] ? 0 : newText.length)];
      const lineText = getLine(patternInput_1[0]);
      const visualWidth = strWidth(settings.tabWidth, _Extensions.String.takeStart(patternInput_1[1], lineText)) | 0;

      if (visualWidth <= settings.column) {
        return noEdit;
      } else {
        const fakeSelection = new _Types.Selection(new _Types.Position(patternInput_1[0], 0), new _Types.Position(patternInput_1[0], lineText.length));

        const wrappedGetLine = function (i) {
          if (i > patternInput_1[0]) {
            return null;
          } else {
            return getLine(i);
          }
        };

        return function (edit) {
          const afterPos = patternInput[0] ? new _Types.Position(patternInput_1[0] + 1, patternInput[1].length) : new _Types.Position(patternInput_1[0], patternInput_1[1]);
          const selections = [new _Types.Selection(afterPos, afterPos)];
          return new _Types.Edit(edit.startLine, edit.endLine, edit.lines, selections);
        }(rewrap(file, settings, [fakeSelection], wrappedGetLine));
      }
    }
  }
}