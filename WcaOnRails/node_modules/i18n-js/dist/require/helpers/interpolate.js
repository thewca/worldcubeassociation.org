"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpolate = void 0;
const isSet_1 = require("./isSet");
function interpolate(i18n, message, options) {
    options = Object.keys(options).reduce((buffer, key) => {
        buffer[i18n.transformKey(key)] = options[key];
        return buffer;
    }, {});
    const matches = message.match(i18n.placeholder);
    if (!matches) {
        return message;
    }
    while (matches.length) {
        let value;
        const placeholder = matches.shift();
        const name = placeholder.replace(i18n.placeholder, "$1");
        if ((0, isSet_1.isSet)(options[name])) {
            value = options[name].toString().replace(/\$/gm, "_#$#_");
        }
        else if (name in options) {
            value = i18n.nullPlaceholder(i18n, placeholder, message, options);
        }
        else {
            value = i18n.missingPlaceholder(i18n, placeholder, message, options);
        }
        const regex = new RegExp(placeholder.replace(/\{/gm, "\\{").replace(/\}/gm, "\\}"));
        message = message.replace(regex, value);
    }
    return message.replace(/_#\$#_/g, "$");
}
exports.interpolate = interpolate;
//# sourceMappingURL=interpolate.js.map