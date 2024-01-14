import { isSet } from "./isSet";
export function createTranslationOptions(i18n, scope, options) {
    let translationOptions = [{ scope }];
    if (isSet(options.defaults)) {
        translationOptions = translationOptions.concat(options.defaults);
    }
    if (isSet(options.defaultValue)) {
        const message = typeof options.defaultValue === "function"
            ? options.defaultValue(i18n, scope, options)
            : options.defaultValue;
        translationOptions.push({ message });
        delete options.defaultValue;
    }
    return translationOptions;
}
//# sourceMappingURL=createTranslationOptions.js.map