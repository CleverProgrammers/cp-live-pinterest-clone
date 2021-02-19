"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBillingError = exports.FirebaseError = void 0;
const lodash_1 = require("lodash");
const DEFAULT_CHILDREN = [];
const DEFAULT_EXIT = 1;
const DEFAULT_STATUS = 500;
class FirebaseError extends Error {
    constructor(message, options = {}) {
        super();
        this.name = "FirebaseError";
        this.children = lodash_1.defaultTo(options.children, DEFAULT_CHILDREN);
        this.context = options.context;
        this.exit = lodash_1.defaultTo(options.exit, DEFAULT_EXIT);
        this.message = message;
        this.original = options.original;
        this.status = lodash_1.defaultTo(options.status, DEFAULT_STATUS);
    }
}
exports.FirebaseError = FirebaseError;
function isBillingError(e) {
    var _a, _b, _c, _d;
    return !!((_d = (_c = (_b = (_a = e.context) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.details) === null || _d === void 0 ? void 0 : _d.find((d) => {
        var _a;
        return (((_a = d.violations) === null || _a === void 0 ? void 0 : _a.find((v) => v.type === "serviceusage/billing-enabled")) ||
            d.reason == "UREQ_PROJECT_BILLING_NOT_FOUND");
    }));
}
exports.isBillingError = isBillingError;
