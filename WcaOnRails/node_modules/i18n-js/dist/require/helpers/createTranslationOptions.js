"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTranslationOptions = void 0;
const isSet_1 = require("./isSet");
function createTranslationOptions(i18n, scope, options) {
    let translationOptions = [{ scope }];
    if ((0, isSet_1.isSet)(options.defaults)) {
        translationOptions = translationOptions.concat(options.defaults);
    }
    if ((0, isSet_1.isSet)(options.defaultValue)) {
        const message = typeof options.defaultValue === "function"
            ? options.defaultValue(i18n, scope, options)
            : options.defaultValue;
        translationOptions.push({ message });
        delete options.defaultValue;
    }
    return translationOptions;
}
exports.createTranslationOptions = createTranslationOptions;
//# sourceMappingURL=createTranslationOptions.js.map