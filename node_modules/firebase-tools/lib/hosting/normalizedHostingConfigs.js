"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizedHostingConfigs = void 0;
const cli_color_1 = require("cli-color");
const lodash_1 = require("lodash");
const error_1 = require("../error");
function filterOnly(configs, onlyString) {
    if (!onlyString) {
        return configs;
    }
    let onlyTargets = onlyString.split(",");
    if (onlyTargets.includes("hosting")) {
        return configs;
    }
    onlyTargets = onlyTargets
        .filter((target) => target.startsWith("hosting:"))
        .map((target) => target.replace("hosting:", ""));
    const configsBySite = new Map();
    const configsByTarget = new Map();
    for (const c of configs) {
        if (c.site) {
            configsBySite.set(c.site, c);
        }
        if (c.target) {
            configsByTarget.set(c.target, c);
        }
    }
    const filteredConfigs = [];
    for (const onlyTarget of onlyTargets) {
        if (configsBySite.has(onlyTarget)) {
            filteredConfigs.push(configsBySite.get(onlyTarget));
        }
        else if (configsByTarget.has(onlyTarget)) {
            filteredConfigs.push(configsByTarget.get(onlyTarget));
        }
        else {
            throw new error_1.FirebaseError(`Hosting site or target ${cli_color_1.bold(onlyTarget)} not detected in firebase.json`);
        }
    }
    return filteredConfigs;
}
function normalizedHostingConfigs(cmdOptions, options = {}) {
    let configs = lodash_1.cloneDeep(cmdOptions.config.get("hosting"));
    if (!configs) {
        return [];
    }
    if (!Array.isArray(configs)) {
        if (!configs.target && !configs.site) {
            configs.site = cmdOptions.site;
        }
        configs = [configs];
    }
    for (const c of configs) {
        if (c.target && c.site) {
            throw new error_1.FirebaseError(`Hosting configs should only include either "site" or "target", not both.`);
        }
    }
    const hostingConfigs = filterOnly(configs, cmdOptions.only);
    if (options.resolveTargets) {
        for (const cfg of hostingConfigs) {
            if (cfg.target) {
                const matchingTargets = cmdOptions.rc.requireTarget(cmdOptions.project, "hosting", cfg.target);
                if (matchingTargets.length > 1) {
                    throw new error_1.FirebaseError(`Hosting target ${cli_color_1.bold(cfg.target)} is linked to multiple sites, ` +
                        `but only one is permitted. ` +
                        `To clear, run:\n\n  firebase target:clear hosting ${cfg.target}`);
                }
                cfg.site = matchingTargets[0];
            }
            else if (!cfg.site) {
                throw new error_1.FirebaseError('Must supply either "site" or "target" in each "hosting" config.');
            }
        }
    }
    return hostingConfigs;
}
exports.normalizedHostingConfigs = normalizedHostingConfigs;
