import { getFullScope, inferType } from "./helpers";
export const guessStrategy = function (i18n, scope) {
    if (scope instanceof Array) {
        scope = scope.join(i18n.defaultSeparator);
    }
    const message = scope.split(i18n.defaultSeparator).slice(-1)[0];
    return (i18n.missingTranslationPrefix +
        message
            .replace("_", " ")
            .replace(/([a-z])([A-Z])/g, (_match, p1, p2) => `${p1} ${p2.toLowerCase()}`));
};
export const messageStrategy = (i18n, scope, options) => {
    const fullScope = getFullScope(i18n, scope, options);
    const locale = "locale" in options ? options.locale : i18n.locale;
    const localeType = inferType(locale);
    const fullScopeWithLocale = [
        localeType == "string" ? locale : localeType,
        fullScope,
    ].join(i18n.defaultSeparator);
    return `[missing "${fullScopeWithLocale}" translation]`;
};
export const errorStrategy = (i18n, scope, options) => {
    const fullScope = getFullScope(i18n, scope, options);
    const fullScopeWithLocale = [i18n.locale, fullScope].join(i18n.defaultSeparator);
    throw new Error(`Missing translation: ${fullScopeWithLocale}`);
};
export class MissingTranslation {
    constructor(i18n) {
        this.i18n = i18n;
        this.registry = {};
        this.register("guess", guessStrategy);
        this.register("message", messageStrategy);
        this.register("error", errorStrategy);
    }
    register(name, strategy) {
        this.registry[name] = strategy;
    }
    get(scope, options) {
        var _a;
        return this.registry[(_a = options.missingBehavior) !== null && _a !== void 0 ? _a : this.i18n.missingBehavior](this.i18n, scope, options);
    }
}
//# sourceMappingURL=MissingTranslation.js.map