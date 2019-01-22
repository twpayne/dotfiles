"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setType = setType;
exports.getType = getType;
const types = new Map();
function setType(fullName, cons) {
  types.set(fullName, cons);
}
function getType(fullName) {
  return types.get(fullName);
}
exports.default = {
  reflection: Symbol("reflection")
};