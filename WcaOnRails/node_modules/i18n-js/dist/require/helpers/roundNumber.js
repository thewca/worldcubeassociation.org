"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundNumber = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const expandRoundMode_1 = require("./expandRoundMode");
function digitCount(numeric) {
    if (numeric.isZero()) {
        return 1;
    }
    return Math.floor(Math.log10(numeric.abs().toNumber()) + 1);
}
function getAbsolutePrecision(numeric, { precision, significant }) {
    if (significant && precision !== null && precision > 0) {
        return precision - digitCount(numeric);
    }
    return precision;
}
function roundNumber(numeric, options) {
    const precision = getAbsolutePrecision(numeric, options);
    if (precision === null) {
        return numeric.toString();
    }
    const roundMode = (0, expandRoundMode_1.expandRoundMode)(options.roundMode);
    if (precision >= 0) {
        return numeric.toFixed(precision, roundMode);
    }
    const rounder = Math.pow(10, Math.abs(precision));
    numeric = new bignumber_js_1.default(numeric.div(rounder).toFixed(0, roundMode)).times(rounder);
    return numeric.toString();
}
exports.roundNumber = roundNumber;
//# sourceMappingURL=roundNumber.js.map