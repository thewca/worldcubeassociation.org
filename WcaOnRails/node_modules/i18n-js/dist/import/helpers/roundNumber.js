import BigNumber from "bignumber.js";
import { expandRoundMode } from "./expandRoundMode";
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
export function roundNumber(numeric, options) {
    const precision = getAbsolutePrecision(numeric, options);
    if (precision === null) {
        return numeric.toString();
    }
    const roundMode = expandRoundMode(options.roundMode);
    if (precision >= 0) {
        return numeric.toFixed(precision, roundMode);
    }
    const rounder = Math.pow(10, Math.abs(precision));
    numeric = new BigNumber(numeric.div(rounder).toFixed(0, roundMode)).times(rounder);
    return numeric.toString();
}
//# sourceMappingURL=roundNumber.js.map