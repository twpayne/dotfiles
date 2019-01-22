"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DocState = exports.Edit = exports.Selection = exports.Position = exports.Settings = exports.File = undefined;

var _Symbol2 = require("../fable-core/Symbol");

var _Symbol3 = _interopRequireDefault(_Symbol2);

var _Util = require("../fable-core/Util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class File {
  constructor(language, path) {
    this.language = language;
    this.path = path;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Rewrap.File",
      interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
      properties: {
        language: "string",
        path: "string"
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

exports.File = File;
(0, _Symbol2.setType)("Rewrap.File", File);

class Settings {
  constructor(column, tabWidth, doubleSentenceSpacing, reformat, wholeComment) {
    this.column = column | 0;
    this.tabWidth = tabWidth | 0;
    this.doubleSentenceSpacing = doubleSentenceSpacing;
    this.reformat = reformat;
    this.wholeComment = wholeComment;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Rewrap.Settings",
      interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
      properties: {
        column: "number",
        tabWidth: "number",
        doubleSentenceSpacing: "boolean",
        reformat: "boolean",
        wholeComment: "boolean"
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

exports.Settings = Settings;
(0, _Symbol2.setType)("Rewrap.Settings", Settings);

class Position {
  constructor(line, character) {
    this.line = line | 0;
    this.character = character | 0;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Rewrap.Position",
      interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
      properties: {
        line: "number",
        character: "number"
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

exports.Position = Position;
(0, _Symbol2.setType)("Rewrap.Position", Position);

class Selection {
  constructor(anchor, active) {
    this.anchor = anchor;
    this.active = active;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Rewrap.Selection",
      interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
      properties: {
        anchor: Position,
        active: Position
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

exports.Selection = Selection;
(0, _Symbol2.setType)("Rewrap.Selection", Selection);

class Edit {
  constructor(startLine, endLine, lines, selections) {
    this.startLine = startLine | 0;
    this.endLine = endLine | 0;
    this.lines = lines;
    this.selections = selections;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Rewrap.Edit",
      interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
      properties: {
        startLine: "number",
        endLine: "number",
        lines: (0, _Util.Array)("string"),
        selections: (0, _Util.Array)(Selection)
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

exports.Edit = Edit;
(0, _Symbol2.setType)("Rewrap.Edit", Edit);

class DocState {
  constructor(filePath, version, selections) {
    this.filePath = filePath;
    this.version = version | 0;
    this.selections = selections;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Rewrap.DocState",
      interfaces: ["FSharpRecord", "System.IEquatable", "System.IComparable"],
      properties: {
        filePath: "string",
        version: "number",
        selections: (0, _Util.Array)(Selection)
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

exports.DocState = DocState;
(0, _Symbol2.setType)("Rewrap.DocState", DocState);