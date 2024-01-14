import BigNumber from "bignumber.js";
export function numberToDelimited(input, options) {
    const numeric = new BigNumber(input);
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
//# sourceMappingURL=numberToDelimited.js.map