"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let globalState;
function getFromGlobalState(key, defaultValue) {
    if (!globalState) {
        return defaultValue;
    }
    return globalState.get(key, defaultValue);
}
exports.getFromGlobalState = getFromGlobalState;
function updateGlobalState(key, value) {
    if (!globalState) {
        return;
    }
    return globalState.update(key, value);
}
exports.updateGlobalState = updateGlobalState;
function setGlobalState(state) {
    globalState = state;
}
exports.setGlobalState = setGlobalState;
//# sourceMappingURL=stateUtils.js.map