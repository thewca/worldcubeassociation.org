"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberToDelimited = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
function numberToDelimited(input, options) {
    const numeric = new bignumber_js_1.default(input);
    if (!numeric.isFinite()) {
        return input.toString();
    }
    if (!options.delimiterPattern.global) {
        throw new Error(`options.delimiterPattern must be a global regular expression; received ${options.delimiterPattern}`);
    }
    let [left, right] = numeric.toString().split(".");
    left = left.replace(options.delimiterPattern, (digitToDelimiter) => `${digitToDelimiter}${options.delimiter}`);
    return [left, right].filter(Boolean).join(options.separator);
}
exports.numberToDelimited = numberToDelimited;
//# sourceMappingURL=numberToDelimited.js.map