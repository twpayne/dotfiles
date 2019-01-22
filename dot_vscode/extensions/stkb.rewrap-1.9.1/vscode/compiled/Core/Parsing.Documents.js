"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.languages = exports.Language = undefined;
exports.plainText = plainText;
exports.findLanguage = findLanguage;
exports.select = select;

var _Symbol2 = require("../fable-core/Symbol");

var _Symbol3 = _interopRequireDefault(_Symbol2);

var _Util = require("../fable-core/Util");

var _Types = require("./Types");

var _Nonempty = require("./Nonempty");

var _Block = require("./Block");

var _String = require("../fable-core/String");

var _Parsing = require("./Parsing.Core");

var _CurriedLambda = require("../fable-core/CurriedLambda");

var _CurriedLambda2 = _interopRequireDefault(_CurriedLambda);

var _List = require("../fable-core/List");

var _Parsing2 = require("./Parsing.SourceCode");

var _Parsing3 = require("./Parsing.DocComments");

var _Parsing4 = require("./Parsing.Markdown");

var _Parsing5 = require("./Parsing.Latex");

var _Seq = require("../fable-core/Seq");

var _Option = require("../fable-core/Option");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Language {
  constructor(name, aliases, extensions, parser) {
    this.name = name;
    this.aliases = aliases;
    this.extensions = extensions;
    this.parser = parser;
  }

  [_Symbol3.default.reflection]() {
    return {
      type: "Parsing.Documents.Language",
      interfaces: ["FSharpRecord"],
      properties: {
        name: "string",
        aliases: (0, _Util.Array)("string"),
        extensions: (0, _Util.Array)("string"),
        parser: (0, _Util.Function)([_Types.Settings, (0, _Util.makeGeneric)(_Nonempty.Nonempty, {
          T: "string"
        }), (0, _Util.makeGeneric)(_Nonempty.Nonempty, {
          T: _Block.Block
        })])
      }
    };
  }

}

exports.Language = Language;
(0, _Symbol2.setType)("Parsing.Documents.Language", Language);

function lang(name, aliases, extensions, parser) {
  return new Language(name, (0, _String.split)(aliases, ["|"], null, 1), (0, _String.split)(extensions, ["|"], null, 1), parser);
}

function plainText(settings) {
  const paragraphs = $var1 => {
    var fn;
    return (fn = function (lines) {
      return (0, _Parsing.indentSeparatedParagraphBlock)(function (tupledArg) {
        return (0, _Block.text)(tupledArg[0], tupledArg[1]);
      }, lines);
    }, function (arg10__1) {
      return (0, _Nonempty.map)(fn, arg10__1);
    })((0, _Parsing.splitIntoChunks)(function (arg10_) {
      return (0, _Parsing.onIndent)(settings.tabWidth, arg10_);
    })($var1));
  };

  return (0, _Parsing.repeatToEnd)((0, _Parsing.takeUntil)(_Parsing.blankLines, paragraphs));
}

const configFile = (0, _CurriedLambda2.default)((() => {
  const commentParsers = (0, _List.ofArray)([(0, _Parsing2.line)("#")]);
  return (0, _CurriedLambda2.default)(function (settings) {
    return (0, _Parsing2.sourceCode)(commentParsers, settings);
  });
})());
const languages = exports.languages = [lang("AutoHotkey", "ahk", ".ahk", (() => {
  const commentParsers = (0, _List.ofArray)([(0, _Parsing2.line)(";"), _Parsing2.cBlock]);
  return (0, _CurriedLambda2.default)(function (settings) {
    return (0, _Parsing2.sourceCode)(commentParsers, settings);
  });
})()), lang("Basic", "vb", ".vb", (() => {
  const commentParsers_1 = (0, _List.ofArray)([(0, _Parsing2.customLine)(_Parsing2.html, "'''"), (0, _Parsing2.line)("'")]);
  return (0, _CurriedLambda2.default)(function (settings_1) {
    return (0, _Parsing2.sourceCode)(commentParsers_1, settings_1);
  });
})()), lang("Batch file", "bat", ".bat", (() => {
  const commentParsers_2 = (0, _List.ofArray)([(0, _Parsing2.line)("(?:rem|::)")]);
  return (0, _CurriedLambda2.default)(function (settings_2) {
    return (0, _Parsing2.sourceCode)(commentParsers_2, settings_2);
  });
})()), lang("C/C++", "c|c++|cpp", ".c|.cpp|.h", _Parsing2.java), lang("C#", "csharp", ".cs", (() => {
  const commentParsers_3 = (0, _List.ofArray)([(0, _Parsing2.customLine)(_Parsing2.html, "///"), _Parsing2.cLine, (0, _CurriedLambda2.default)(_Parsing2.customBlock)(_Parsing3.javadoc, ["\\*?", " * "], _Parsing2.javadocMarkers), _Parsing2.cBlock]);
  return (0, _CurriedLambda2.default)(function (settings_3) {
    return (0, _Parsing2.sourceCode)(commentParsers_3, settings_3);
  });
})()), lang("CoffeeScript", "", ".coffee", (() => {
  const commentParsers_4 = (0, _List.ofArray)([(0, _CurriedLambda2.default)(_Parsing2.customBlock)(_Parsing3.javadoc, ["[*#]", " * "], ["###\\*", "###"]), (0, _Parsing2.block)(["###", "###"]), (0, _Parsing2.line)("#")]);
  return (0, _CurriedLambda2.default)(function (settings_4) {
    return (0, _Parsing2.sourceCode)(commentParsers_4, settings_4);
  });
})()), lang("Configuration", "properties", ".conf|.gitconfig", configFile), lang("Crystal", "", ".cr", (() => {
  const commentParsers_5 = (0, _List.ofArray)([(0, _Parsing2.line)("#")]);
  return (0, _CurriedLambda2.default)(function (settings_5) {
    return (0, _Parsing2.sourceCode)(commentParsers_5, settings_5);
  });
})()), lang("CSS", "", ".css", _Parsing2.css), lang("D", "", ".d", (() => {
  const commentParsers_6 = (0, _List.ofArray)([(0, _Parsing2.customLine)(_Parsing3.ddoc, "///"), _Parsing2.cLine, (0, _CurriedLambda2.default)(_Parsing2.customBlock)(_Parsing3.ddoc, ["\\*", " * "], _Parsing2.javadocMarkers), (0, _CurriedLambda2.default)(_Parsing2.customBlock)(_Parsing3.ddoc, ["\\+", " + "], ["/\\+\\+", "\\+/"]), _Parsing2.cBlock, (0, _Parsing2.block)(["/\\+", "\\+/"])]);
  return (0, _CurriedLambda2.default)(function (settings_6) {
    return (0, _Parsing2.sourceCode)(commentParsers_6, settings_6);
  });
})()), lang("Dart", "", ".dart", (() => {
  const commentParsers_7 = (0, _List.ofArray)([(0, _Parsing2.customLine)(_Parsing3.dartdoc, "///"), _Parsing2.cLine, (0, _CurriedLambda2.default)(_Parsing2.customBlock)(_Parsing3.dartdoc, ["\\*", " * "], _Parsing2.javadocMarkers), _Parsing2.cBlock]);
  return (0, _CurriedLambda2.default)(function (settings_7) {
    return (0, _Parsing2.sourceCode)(commentParsers_7, settings_7);
  });
})()), lang("Dockerfile", "docker", "dockerfile", configFile), lang("Elixir", "", ".ex|.exs", (() => {
  const commentParsers_8 = (0, _List.ofArray)([(0, _Parsing2.line)("#"), (0, _Parsing2.block)(["@(module|type|)doc\\s+\"\"\"", "\"\"\""])]);
  return (0, _CurriedLambda2.default)(function (settings_8) {
    return (0, _Parsing2.sourceCode)(commentParsers_8, settings_8);
  });
})()), lang("Elm", "", ".elm", (() => {
  const commentParsers_9 = (0, _List.ofArray)([(0, _Parsing2.line)("--"), (0, _Parsing2.block)(["{-\\|?", "-}"])]);
  return (0, _CurriedLambda2.default)(function (settings_9) {
    return (0, _Parsing2.sourceCode)(commentParsers_9, settings_9);
  });
})()), lang("F#", "fsharp", ".fs|.fsx", (() => {
  const commentParsers_10 = (0, _List.ofArray)([(0, _Parsing2.customLine)(_Parsing2.html, "///"), _Parsing2.cLine, (0, _Parsing2.block)(["\\(\\*", "\\*\\)"])]);
  return (0, _CurriedLambda2.default)(function (settings_10) {
    return (0, _Parsing2.sourceCode)(commentParsers_10, settings_10);
  });
})()), lang("Go", "", ".go", (() => {
  const commentParsers_11 = (0, _List.ofArray)([(0, _CurriedLambda2.default)(_Parsing2.customBlock)((0, _CurriedLambda2.default)(_Parsing3.godoc), ["", ""], _Parsing2.javadocMarkers), _Parsing2.cBlock, (0, _Parsing2.customLine)((0, _CurriedLambda2.default)(_Parsing3.godoc), "//"), _Parsing2.cLine]);
  return (0, _CurriedLambda2.default)(function (settings_13) {
    return (0, _Parsing2.sourceCode)(commentParsers_11, settings_13);
  });
})()), lang("Git commit", "git-commit", "tag_editmsg", (0, _CurriedLambda2.default)(_Parsing4.markdown)), lang("GraphQL", "", ".graphql|.gql", configFile), lang("Groovy", "", ".groovy", _Parsing2.java), lang("Haskell", "", ".hs", (() => {
  const commentParsers_12 = (0, _List.ofArray)([(0, _Parsing2.line)("--"), (0, _Parsing2.block)(["{-\\s*\\|?", "-}"])]);
  return (0, _CurriedLambda2.default)(function (settings_15) {
    return (0, _Parsing2.sourceCode)(commentParsers_12, settings_15);
  });
})()), lang("HCL", "terraform", ".hcl|.tf", (() => {
  const commentParsers_13 = (0, _List.ofArray)([(0, _CurriedLambda2.default)(_Parsing2.customBlock)(_Parsing3.javadoc, ["\\*?", " * "], _Parsing2.javadocMarkers), _Parsing2.cBlock, (0, _Parsing2.customLine)(_Parsing3.javadoc, "//[/!]"), _Parsing2.cLine, (0, _Parsing2.line)("#")]);
  return (0, _CurriedLambda2.default)(function (settings_16) {
    return (0, _Parsing2.sourceCode)(commentParsers_13, settings_16);
  });
})()), lang("HTML", "vue", ".htm|.html|.vue", _Parsing2.html), lang("INI", "", ".ini", (() => {
  const commentParsers_14 = (0, _List.ofArray)([(0, _Parsing2.line)("[#;]")]);
  return (0, _CurriedLambda2.default)(function (settings_17) {
    return (0, _Parsing2.sourceCode)(commentParsers_14, settings_17);
  });
})()), lang("Java", "", ".java", _Parsing2.java), lang("JavaScript", "javascriptreact|js", ".js|.jsx", _Parsing2.java), lang("JSON", "json5", ".json|.json5", _Parsing2.java), lang("LaTeX", "tex", ".bbx|.cbx|.cls|.sty|.tex", (0, _CurriedLambda2.default)(_Parsing5.latex)), lang("Lean", "", ".lean", (() => {
  const commentParsers_15 = (0, _List.ofArray)([(0, _Parsing2.line)("--"), (0, _Parsing2.block)(["/-[-!]?", "-/"])]);
  return (0, _CurriedLambda2.default)(function (settings_19) {
    return (0, _Parsing2.sourceCode)(commentParsers_15, settings_19);
  });
})()), lang("Less", "", ".less", _Parsing2.java), lang("Lua", "", ".lua", (() => {
  const commentParsers_16 = (0, _List.ofArray)([(0, _Parsing2.line)("--"), (0, _Parsing2.block)(["--\\[\\[", "\\]\\]"])]);
  return (0, _CurriedLambda2.default)(function (settings_20) {
    return (0, _Parsing2.sourceCode)(commentParsers_16, settings_20);
  });
})()), lang("Makefile", "make", "makefile", configFile), lang("Markdown", "", ".md", (0, _CurriedLambda2.default)(_Parsing4.markdown)), lang("MATLAB", "", "", (() => {
  const commentParsers_17 = (0, _List.ofArray)([(0, _Parsing2.line)("%(?![%{}])"), (0, _Parsing2.block)(["%\\{", "%\\}"])]);
  return (0, _CurriedLambda2.default)(function (settings_22) {
    return (0, _Parsing2.sourceCode)(commentParsers_17, settings_22);
  });
})()), lang("Objective-C", "", ".m|.mm", _Parsing2.java), lang("Perl", "perl6", ".p6|.pl|.pl6|.pm|.pm6", configFile), lang("PHP", "", ".php", (() => {
  const commentParsers_18 = (0, _List.ofArray)([(0, _CurriedLambda2.default)(_Parsing2.customBlock)(_Parsing3.javadoc, ["\\*", " * "], _Parsing2.javadocMarkers), _Parsing2.cBlock, (0, _Parsing2.line)("(?://|#)")]);
  return (0, _CurriedLambda2.default)(function (settings_23) {
    return (0, _Parsing2.sourceCode)(commentParsers_18, settings_23);
  });
})()), lang("PowerShell", "", ".ps1|.psd1|.psm1", (() => {
  const commentParsers_19 = (0, _List.ofArray)([(0, _Parsing2.customLine)(_Parsing3.psdoc, "#"), (0, _CurriedLambda2.default)(_Parsing2.customBlock)(_Parsing3.psdoc, ["", ""], ["<#", "#>"])]);
  return (0, _CurriedLambda2.default)(function (settings_24) {
    return (0, _Parsing2.sourceCode)(commentParsers_19, settings_24);
  });
})()), lang("Protobuf", "proto|proto3", ".proto", (() => {
  const commentParsers_20 = (0, _List.ofArray)([_Parsing2.cLine]);
  return (0, _CurriedLambda2.default)(function (settings_25) {
    return (0, _Parsing2.sourceCode)(commentParsers_20, settings_25);
  });
})()), lang("Pug", "jade", ".jade|.pug", (() => {
  const commentParsers_21 = (0, _List.ofArray)([_Parsing2.cLine]);
  return (0, _CurriedLambda2.default)(function (settings_26) {
    return (0, _Parsing2.sourceCode)(commentParsers_21, settings_26);
  });
})()), lang("PureScript", "", ".purs", (() => {
  const commentParsers_22 = (0, _List.ofArray)([(0, _Parsing2.line)("--\\s*\\|"), (0, _Parsing2.line)("--"), (0, _Parsing2.block)(["{-\\s*\\|?", "-}"])]);
  return (0, _CurriedLambda2.default)(function (settings_27) {
    return (0, _Parsing2.sourceCode)(commentParsers_22, settings_27);
  });
})()), lang("Python", "", ".py", (() => {
  const commentParsers_23 = (0, _List.ofArray)([(0, _Parsing2.line)("#"), (0, _Parsing2.block)(["('''|\"\"\")", "('''|\"\"\")"])]);
  return (0, _CurriedLambda2.default)(function (settings_28) {
    return (0, _Parsing2.sourceCode)(commentParsers_23, settings_28);
  });
})()), lang("R", "", ".r", configFile), lang("Ruby", "", ".rb", (() => {
  const commentParsers_24 = (0, _List.ofArray)([(0, _Parsing2.line)("#"), (0, _Parsing2.block)(["=begin", "=end"])]);
  return (0, _CurriedLambda2.default)(function (settings_29) {
    return (0, _Parsing2.sourceCode)(commentParsers_24, settings_29);
  });
})()), lang("Rust", "", ".rs", (() => {
  const commentParsers_25 = (0, _List.ofArray)([(0, _Parsing2.line)("\\/\\/(?:\\/|\\!)?")]);
  return (0, _CurriedLambda2.default)(function (settings_30) {
    return (0, _Parsing2.sourceCode)(commentParsers_25, settings_30);
  });
})()), lang("SCSS", "", ".scss", _Parsing2.java), lang("Shaderlab", "", ".shader", _Parsing2.java), lang("Shell script", "shellscript", ".sh", configFile), lang("SQL", "", ".sql", (() => {
  const commentParsers_26 = (0, _List.ofArray)([(0, _Parsing2.line)("--"), _Parsing2.cBlock]);
  return (0, _CurriedLambda2.default)(function (settings_31) {
    return (0, _Parsing2.sourceCode)(commentParsers_26, settings_31);
  });
})()), lang("Swift", "", ".swift", _Parsing2.java), lang("Tcl", "", ".tcl", configFile), lang("TOML", "", ".toml", configFile), lang("TypeScript", "typescriptreact", ".ts|.tsx", _Parsing2.java), lang("XML", "xsl", ".xml|.xsl", _Parsing2.html), lang("YAML", "", ".yaml|.yml", (0, _CurriedLambda2.default)(function (settings_32) {
  const comments = (0, _Parsing2.line)("#{1,3}", settings_32);
  return (0, _Parsing.repeatToEnd)((0, _Parsing.takeUntil)(comments, plainText(settings_32)));
}))];

function languageFromFileName(filePath) {
  const fileName = (0, _Seq.last)((0, _String.split)(filePath, "\\", "/"));
  let extensionOrName;
  const matchValue = (0, _String.split)(fileName.toLocaleLowerCase(), ["."], null, 0);

  if (matchValue != null ? matchValue.length === 1 : false) {
    const name = matchValue[0];
    extensionOrName = name;
  } else {
    extensionOrName = "." + (0, _Seq.last)(matchValue);
  }

  return (0, _Seq.tryFind)(function (l) {
    return (0, _Seq.exists)($var2 => (0, _Util.equals)(extensionOrName, $var2), l.extensions);
  }, languages);
}

function findLanguage(name, filePath) {
  const findName = function (name_1) {
    return (0, _Seq.tryFind)(function (l) {
      return l.name.toLocaleLowerCase() === name_1.toLocaleLowerCase() ? true : (0, _Seq.exists)($var3 => (0, _Util.equals)(name_1.toLocaleLowerCase(), $var3), l.aliases);
    }, languages);
  };

  return (0, _Option.defaultArgWith)(findName(name), function () {
    return languageFromFileName(filePath);
  });
}

function select(language, filePath) {
  return (0, _CurriedLambda2.default)((0, _CurriedLambda2.default)(function (option) {
    return (0, _Option.defaultArg)(option, plainText);
  })((0, _Option.defaultArg)(findLanguage(language, filePath), null, (0, _CurriedLambda2.default)(function (l) {
    return l.parser;
  }))));
}