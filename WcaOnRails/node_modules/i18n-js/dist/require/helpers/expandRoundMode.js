"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandRoundMode = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
var RoundingModeMap;
(function (RoundingModeMap) {
    RoundingModeMap[RoundingModeMap["up"] = bignumber_js_1.default.ROUND_UP] = "up";
    RoundingModeMap[RoundingModeMap["down"] = bignumber_js_1.default.ROUND_DOWN] = "down";
    RoundingModeMap[RoundingModeMap["truncate"] = bignumber_js_1.default.ROUND_DOWN] = "truncate";
    RoundingModeMap[RoundingModeMap["halfUp"] = bignumber_js_1.default.ROUND_HALF_UP] = "halfUp";
    RoundingModeMap[RoundingModeMap["default"] = bignumber_js_1.default.ROUND_HALF_UP] = "default";
    RoundingModeMap[RoundingModeMap["halfDown"] = bignumber_js_1.default.ROUND_HALF_DOWN] = "halfDown";
    RoundingModeMap[RoundingModeMap["halfEven"] = bignumber_js_1.default.ROUND_HALF_EVEN] = "halfEven";
    RoundingModeMap[RoundingModeMap["banker"] = bignumber_js_1.default.ROUND_HALF_EVEN] = "banker";
    RoundingModeMap[RoundingModeMap["ceiling"] = bignumber_js_1.default.ROUND_CEIL] = "ceiling";
    RoundingModeMap[RoundingModeMap["ceil"] = bignumber_js_1.default.ROUND_CEIL] = "ceil";
    RoundingModeMap[RoundingModeMap["floor"] = bignumber_js_1.default.ROUND_FLOOR] = "floor";
})(RoundingModeMap || (RoundingModeMap = {}));
function expandRoundMode(roundMode) {
    var _a;
    return ((_a = RoundingModeMap[roundMode]) !== null && _a !== void 0 ? _a : RoundingModeMap.default);
}
exports.expandRoundMode = expandRoundMode;
//# sourceMappingURL=expandRoundMode.js.map