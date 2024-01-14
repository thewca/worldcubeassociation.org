export function inferType(instance) {
    var _a, _b;
    if (instance === null) {
        return "null";
    }
    const type = typeof instance;
    if (type !== "object") {
        return type;
    }
    return ((_b = (_a = instance === null || instance === void 0 ? void 0 : instance.constructor) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || "object";
}
//# sourceMappingURL=inferType.js.map