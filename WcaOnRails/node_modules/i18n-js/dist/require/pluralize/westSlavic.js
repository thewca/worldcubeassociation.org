"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.westSlavic = void 0;
const westSlavic = (_i18n, count) => {
    const few = [2, 3, 4];
    let key;
    if (count == 1) {
        key = "one";
    }
    else if (few.includes(count)) {
        key = "few";
    }
    else {
        key = "other";
    }
    return [key];
};
exports.westSlavic = westSlavic;
//# sourceMappingURL=westSlavic.js.map