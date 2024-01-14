"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFullScope = void 0;
function getFullScope(i18n, scope, options) {
    let result = "";
    if (scope instanceof String || typeof scope === "string") {
        result = scope;
    }
    if (scope instanceof Array) {
        result = scope.join(i18n.defaultSeparator);
    }
    if (options.scope) {
        result = [options.scope, result].join(i18n.defaultSeparator);
    }
    return result;
}
exports.getFullScope = getFullScope;
//# sourceMappingURL=getFullScope.js.map