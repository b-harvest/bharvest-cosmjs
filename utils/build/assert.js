"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertDefined = exports.assert = void 0;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function assert(condition, msg) {
    if (!condition) {
        throw new Error(msg || "condition is not truthy");
    }
}
exports.assert = assert;
function assertDefined(value, msg) {
    if (value === undefined) {
        throw new Error(msg || "value is undefined");
    }
}
exports.assertDefined = assertDefined;
//# sourceMappingURL=assert.js.map