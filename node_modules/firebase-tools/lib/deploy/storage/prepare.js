"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const gcp = require("../../gcp");
const rulesDeploy_1 = require("../../rulesDeploy");
async function default_1(context, options) {
    let rulesConfig = options.config.get("storage");
    if (!rulesConfig) {
        return;
    }
    _.set(context, "storage.rules", rulesConfig);
    const rulesDeploy = new rulesDeploy_1.RulesDeploy(options, rulesDeploy_1.RulesetServiceType.FIREBASE_STORAGE);
    _.set(context, "storage.rulesDeploy", rulesDeploy);
    if (_.isPlainObject(rulesConfig)) {
        const defaultBucket = await gcp.storage.getDefaultBucket(options.project);
        rulesConfig = [_.assign(rulesConfig, { bucket: defaultBucket })];
        _.set(context, "storage.rules", rulesConfig);
    }
    rulesConfig.forEach((ruleConfig) => {
        if (ruleConfig.target) {
            options.rc.requireTarget(context.projectId, "storage", ruleConfig.target);
        }
        rulesDeploy.addFile(ruleConfig.rules);
    });
    await rulesDeploy.compile();
}
exports.default = default_1;
