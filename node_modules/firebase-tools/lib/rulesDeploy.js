"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesDeploy = exports.RulesetServiceType = void 0;
const _ = require("lodash");
const clc = require("cli-color");
const fs = require("fs");
const gcp = require("./gcp");
const logger = require("./logger");
const error_1 = require("./error");
const utils = require("./utils");
const prompt_1 = require("./prompt");
const QUOTA_EXCEEDED_STATUS_CODE = 429;
const RULESET_COUNT_LIMIT = 1000;
const RULESETS_TO_GC = 10;
var RulesetServiceType;
(function (RulesetServiceType) {
    RulesetServiceType["CLOUD_FIRESTORE"] = "cloud.firestore";
    RulesetServiceType["FIREBASE_STORAGE"] = "firebase.storage";
})(RulesetServiceType = exports.RulesetServiceType || (exports.RulesetServiceType = {}));
const RulesetType = {
    [RulesetServiceType.CLOUD_FIRESTORE]: "firestore",
    [RulesetServiceType.FIREBASE_STORAGE]: "storage",
};
class RulesDeploy {
    constructor(options, type) {
        this.options = options;
        this.type = type;
        this.project = options.project;
        this.rulesFiles = {};
        this.rulesetNames = {};
    }
    addFile(path) {
        const fullPath = this.options.config.path(path);
        let src;
        try {
            src = fs.readFileSync(fullPath, "utf8");
        }
        catch (e) {
            logger.debug("[rules read error]", e.stack);
            throw new error_1.FirebaseError("Error reading rules file " + clc.bold(path));
        }
        this.rulesFiles[path] = [{ name: path, content: src }];
    }
    async compile() {
        await Promise.all(Object.keys(this.rulesFiles).map((filename) => {
            return this.compileRuleset(filename, this.rulesFiles[filename]);
        }));
    }
    async getCurrentRules(service) {
        const latestName = await gcp.rules.getLatestRulesetName(this.options.project, service);
        let latestContent = null;
        if (latestName) {
            latestContent = await gcp.rules.getRulesetContent(latestName);
        }
        return { latestName, latestContent };
    }
    async createRulesets(service) {
        const createdRulesetNames = [];
        const { latestName: latestRulesetName, latestContent: latestRulesetContent, } = await this.getCurrentRules(service);
        const newRulesetsByFilename = new Map();
        for (const filename of Object.keys(this.rulesFiles)) {
            const files = this.rulesFiles[filename];
            if (latestRulesetName && _.isEqual(files, latestRulesetContent)) {
                utils.logBullet(`${clc.bold.cyan(RulesetType[this.type] + ":")} latest version of ${clc.bold(filename)} already up to date, skipping upload...`);
                this.rulesetNames[filename] = latestRulesetName;
                continue;
            }
            utils.logBullet(`${clc.bold.cyan(RulesetType[this.type] + ":")} uploading rules ${clc.bold(filename)}...`);
            newRulesetsByFilename.set(filename, gcp.rules.createRuleset(this.options.project, files));
        }
        try {
            await Promise.all(newRulesetsByFilename.values());
            for (const [filename, rulesetName] of newRulesetsByFilename) {
                this.rulesetNames[filename] = await rulesetName;
                createdRulesetNames.push(await rulesetName);
            }
        }
        catch (err) {
            if (err.status !== QUOTA_EXCEEDED_STATUS_CODE) {
                throw err;
            }
            utils.logBullet(clc.bold.yellow(RulesetType[this.type] + ":") +
                " quota exceeded error while uploading rules");
            const history = await gcp.rules.listAllRulesets(this.options.project);
            if (history.length > RULESET_COUNT_LIMIT) {
                const answers = await prompt_1.prompt({
                    confirm: this.options.force,
                }, [
                    {
                        type: "confirm",
                        name: "confirm",
                        message: `You have ${history.length} rules, do you want to delete the oldest ${RULESETS_TO_GC} to free up space?`,
                        default: false,
                    },
                ]);
                if (answers.confirm) {
                    const releases = await gcp.rules.listAllReleases(this.options.project);
                    const unreleased = _.reject(history, (ruleset) => {
                        return !!releases.find((release) => release.rulesetName === ruleset.name);
                    });
                    const entriesToDelete = unreleased.reverse().slice(0, RULESETS_TO_GC);
                    for (const entry of entriesToDelete) {
                        await gcp.rules.deleteRuleset(this.options.project, gcp.rules.getRulesetId(entry));
                        logger.debug(`[rules] Deleted ${entry.name}`);
                    }
                    utils.logBullet(clc.bold.yellow(RulesetType[this.type] + ":") + " retrying rules upload");
                    return this.createRulesets(service);
                }
            }
        }
        return createdRulesetNames;
    }
    async release(filename, resourceName, subResourceName) {
        if (resourceName === RulesetServiceType.FIREBASE_STORAGE && !subResourceName) {
            throw new error_1.FirebaseError(`Cannot release resource type "${resourceName}"`);
        }
        await gcp.rules.updateOrCreateRelease(this.options.project, this.rulesetNames[filename], resourceName === RulesetServiceType.FIREBASE_STORAGE
            ? `${resourceName}/${subResourceName}`
            : resourceName);
        utils.logSuccess(`${clc.bold.green(RulesetType[this.type] + ":")} released rules ${clc.bold(filename)} to ${clc.bold(resourceName)}`);
    }
    async compileRuleset(filename, files) {
        utils.logBullet(`${clc.bold.cyan(this.type + ":")} checking ${clc.bold(filename)} for compilation errors...`);
        const response = await gcp.rules.testRuleset(this.options.project, files);
        if (_.get(response, "body.issues", []).length) {
            const warnings = [];
            const errors = [];
            response.body.issues.forEach((issue) => {
                const issueMessage = `[${issue.severity.substring(0, 1)}] ${issue.sourcePosition.line}:${issue.sourcePosition.column} - ${issue.description}`;
                if (issue.severity === "ERROR") {
                    errors.push(issueMessage);
                }
                else {
                    warnings.push(issueMessage);
                }
            });
            if (warnings.length > 0) {
                warnings.forEach((warning) => {
                    utils.logWarning(warning);
                });
            }
            if (errors.length > 0) {
                const add = errors.length === 1 ? "" : "s";
                const message = `Compilation error${add} in ${clc.bold(filename)}:\n${errors.join("\n")}`;
                throw new error_1.FirebaseError(message, { exit: 1 });
            }
        }
        utils.logSuccess(`${clc.bold.green(this.type + ":")} rules file ${clc.bold(filename)} compiled successfully`);
    }
}
exports.RulesDeploy = RulesDeploy;
