"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireHostingSite = void 0;
const getDefaultHostingSite_1 = require("./getDefaultHostingSite");
async function requireHostingSite(options) {
    if (options.site) {
        return Promise.resolve();
    }
    const site = await getDefaultHostingSite_1.getDefaultHostingSite(options);
    options.site = site;
}
exports.requireHostingSite = requireHostingSite;
