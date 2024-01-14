export function getFullScope(i18n, scope, options) {
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
//# sourceMappingURL=getFullScope.js.map