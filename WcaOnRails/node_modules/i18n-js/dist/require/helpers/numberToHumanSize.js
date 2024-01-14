"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberToHumanSize = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const roundNumber_1 = require("./roundNumber");
const expandRoundMode_1 = require("./expandRoundMode");
const STORAGE_UNITS = ["byte", "kb", "mb", "gb", "tb", "pb", "eb"];
function numberToHumanSize(i18n, input, options) {
    const roundMode = (0, expandRoundMode_1.expandRoundMode)(options.roundMode);
    const base = 1024;
    const num = new bignumber_js_1.default(input).abs();
    const smallerThanBase = num.lt(base);
    let numberToBeFormatted;
    const computeExponent = (numeric, units) => {
        const max = units.length - 1;
        const exp = new bignumber_js_1.default(Math.log(numeric.toNumber()))
            .div(Math.log(base))
            .integerValue(bignumber_js_1.default.ROUND_DOWN)
            .toNumber();
        return Math.min(max, exp);
    };
    const storageUnitKey = (units) => {
        const keyEnd = smallerThanBase ? "byte" : units[exponent];
        return `number.human.storage_units.units.${keyEnd}`;
    };
    const exponent = computeExponent(num, STORAGE_UNITS);
    if (smallerThanBase) {
        numberToBeFormatted = num.integerValue();
    }
    else {
        numberToBeFormatted = new bignumber_js_1.default((0, roundNumber_1.roundNumber)(num.div(Math.pow(base, exponent)), {
            significant: options.significant,
            precision: options.precision,
            roundMode: options.roundMode,
        }));
    }
    const format = i18n.translate("number.human.storage_units.format", {
        defaultValue: "%n %u",
    });
    const unit = i18n.translate(storageUnitKey(STORAGE_UNITS), {
        count: num.integerValue().toNumber(),
    });
    let formattedNumber = numberToBeFormatted.toFixed(options.precision, roundMode);
    if (options.stripInsignificantZeros) {
        formattedNumber = formattedNumber
            .replace(/(\..*?)0+$/, "$1")
            .replace(/\.$/, "");
    }
    return format.replace("%n", formattedNumber).replace("%u", unit);
}
exports.numberToHumanSize = numberToHumanSize;
//# sourceMappingURL=numberToHumanSize.js.map