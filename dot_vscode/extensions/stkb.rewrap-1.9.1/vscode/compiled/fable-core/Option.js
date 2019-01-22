"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Some = undefined;
exports.makeSome = makeSome;
exports.getValue = getValue;
exports.defaultArg = defaultArg;
exports.defaultArgWith = defaultArgWith;
exports.filter = filter;

var _Util = require("./Util");

class Some {
  constructor(value) {
    this.value = value;
  }
  // We don't prefix it with "Some" for consistency with erased options
  ToString() {
    return (0, _Util.toString)(this.value);
  }
  Equals(other) {
    if (other == null) {
      return false;
    } else {
      return (0, _Util.equals)(this.value, other instanceof Some ? other.value : other);
    }
  }
  CompareTo(other) {
    if (other == null) {
      return 1;
    } else {
      return (0, _Util.compare)(this.value, other instanceof Some ? other.value : other);
    }
  }
}
exports.Some = Some;
function makeSome(x) {
  return x == null || x instanceof Some ? new Some(x) : x;
}
function getValue(x, acceptNull) {
  if (x == null) {
    if (!acceptNull) {
      throw new Error("Option has no value");
    }
    return null;
  } else {
    return x instanceof Some ? x.value : x;
  }
}
function defaultArg(arg, defaultValue, f) {
  return arg == null ? defaultValue : f != null ? f(getValue(arg)) : getValue(arg);
}
function defaultArgWith(arg, defThunk) {
  return arg == null ? defThunk() : getValue(arg);
}
function filter(predicate, arg) {
  return arg != null ? !predicate(getValue(arg)) ? null : arg : arg;
}