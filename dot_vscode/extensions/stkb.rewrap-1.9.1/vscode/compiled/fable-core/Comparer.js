"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromEqualityComparer = fromEqualityComparer;

var _Symbol = require("./Symbol");

var _Symbol2 = _interopRequireDefault(_Symbol);

var _Util = require("./Util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Comparer {
  constructor(f) {
    this.Compare = f || _Util.compare;
  }
  [_Symbol2.default.reflection]() {
    return { interfaces: ["System.IComparer"] };
  }
}
exports.default = Comparer;
function fromEqualityComparer(comparer) {
  // Sometimes IEqualityComparer also implements IComparer
  if (typeof comparer.Compare === "function") {
    return new Comparer(comparer.Compare);
  } else {
    return new Comparer((x, y) => {
      const xhash = comparer.GetHashCode(x);
      const yhash = comparer.GetHashCode(y);
      if (xhash === yhash) {
        return comparer.Equals(x, y) ? 0 : -1;
      } else {
        return xhash < yhash ? -1 : 1;
      }
    });
  }
}