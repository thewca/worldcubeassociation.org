import BigNumber from "bignumber.js";
var RoundingModeMap;
(function (RoundingModeMap) {
    RoundingModeMap[RoundingModeMap["up"] = BigNumber.ROUND_UP] = "up";
    RoundingModeMap[RoundingModeMap["down"] = BigNumber.ROUND_DOWN] = "down";
    RoundingModeMap[RoundingModeMap["truncate"] = BigNumber.ROUND_DOWN] = "truncate";
    RoundingModeMap[RoundingModeMap["halfUp"] = BigNumber.ROUND_HALF_UP] = "halfUp";
    RoundingModeMap[RoundingModeMap["default"] = BigNumber.ROUND_HALF_UP] = "default";
    RoundingModeMap[RoundingModeMap["halfDown"] = BigNumber.ROUND_HALF_DOWN] = "halfDown";
    RoundingModeMap[RoundingModeMap["halfEven"] = BigNumber.ROUND_HALF_EVEN] = "halfEven";
    RoundingModeMap[RoundingModeMap["banker"] = BigNumber.ROUND_HALF_EVEN] = "banker";
    RoundingModeMap[RoundingModeMap["ceiling"] = BigNumber.ROUND_CEIL] = "ceiling";
    RoundingModeMap[RoundingModeMap["ceil"] = BigNumber.ROUND_CEIL] = "ceil";
    RoundingModeMap[RoundingModeMap["floor"] = BigNumber.ROUND_FLOOR] = "floor";
})(RoundingModeMap || (RoundingModeMap = {}));
export function expandRoundMode(roundMode) {
    var _a;
    return ((_a = RoundingModeMap[roundMode]) !== null && _a !== void 0 ? _a : RoundingModeMap.default);
}
//# sourceMappingURL=expandRoundMode.js.map