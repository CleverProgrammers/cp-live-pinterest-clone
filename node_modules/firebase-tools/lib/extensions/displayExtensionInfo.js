"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConsent = exports.displayUpdateChangesRequiringConfirmation = exports.displayUpdateChangesNoInput = exports.displayExtInfo = void 0;
const _ = require("lodash");
const clc = require("cli-color");
const marked = require("marked");
const TerminalRenderer = require("marked-terminal");
const utils = require("../utils");
const extensionsHelper_1 = require("./extensionsHelper");
const logger = require("../logger");
const error_1 = require("../error");
const prompt_1 = require("../prompt");
marked.setOptions({
    renderer: new TerminalRenderer(),
});
const additionColor = clc.green;
const deletionColor = clc.red;
function displayExtInfo(extensionName, spec, published = false) {
    var _a, _b;
    const lines = [];
    lines.push(`**Name**: ${spec.displayName}`);
    const url = (_a = spec.author) === null || _a === void 0 ? void 0 : _a.url;
    const urlMarkdown = url ? `(**[${url}](${url})**)` : "";
    lines.push(`**Author**: ${(_b = spec.author) === null || _b === void 0 ? void 0 : _b.authorName} ${urlMarkdown}`);
    if (spec.description) {
        lines.push(`**Description**: ${spec.description}`);
    }
    if (published) {
        if (spec.license) {
            lines.push(`**License**: ${spec.license}`);
        }
        lines.push(`**Source code**: ${spec.sourceUrl}`);
    }
    if (lines.length > 0) {
        utils.logLabeledBullet(extensionsHelper_1.logPrefix, `information about '${clc.bold(extensionName)}':`);
        const infoStr = lines.join("\n");
        const formatted = marked(infoStr).replace(/\n+$/, "\n");
        logger.info(formatted);
        return lines;
    }
    else {
        throw new error_1.FirebaseError("Error occurred during installation: cannot parse info from source spec", {
            context: {
                spec: spec,
                extensionName: extensionName,
            },
        });
    }
}
exports.displayExtInfo = displayExtInfo;
function displayUpdateChangesNoInput(spec, newSpec, published = false) {
    var _a, _b, _c, _d;
    const lines = [];
    if (spec.displayName !== newSpec.displayName) {
        lines.push("", "**Name:**", deletionColor(`- ${spec.displayName}`), additionColor(`+ ${newSpec.displayName}`));
    }
    if (((_a = spec.author) === null || _a === void 0 ? void 0 : _a.authorName) !== ((_b = newSpec.author) === null || _b === void 0 ? void 0 : _b.authorName)) {
        lines.push("", "**Author:**", deletionColor(`- ${(_c = spec.author) === null || _c === void 0 ? void 0 : _c.authorName}`), additionColor(`+ ${(_d = spec.author) === null || _d === void 0 ? void 0 : _d.authorName}`));
    }
    if (spec.description !== newSpec.description) {
        lines.push("", "**Description:**", deletionColor(`- ${spec.description}`), additionColor(`+ ${newSpec.description}`));
    }
    if (published) {
        if (spec.sourceUrl !== newSpec.sourceUrl) {
            lines.push("", "**Source code:**", deletionColor(`- ${spec.sourceUrl}`), additionColor(`+ ${newSpec.sourceUrl}`));
        }
    }
    if (spec.billingRequired && !newSpec.billingRequired) {
        lines.push("", "**Billing is no longer required for this extension.**");
    }
    logger.info(marked(lines.join("\n")));
    return lines;
}
exports.displayUpdateChangesNoInput = displayUpdateChangesNoInput;
async function displayUpdateChangesRequiringConfirmation(spec, newSpec) {
    if (spec.license !== newSpec.license) {
        const message = "\n" +
            "**License**\n" +
            deletionColor(spec.license ? `- ${spec.license}\n` : "- None\n") +
            additionColor(newSpec.license ? `+ ${newSpec.license}\n` : "+ None\n") +
            "Do you wish to continue?";
        await getConsent("license", marked(message));
    }
    const apisDiffDeletions = _.differenceWith(spec.apis, _.get(newSpec, "apis", []), _.isEqual);
    const apisDiffAdditions = _.differenceWith(newSpec.apis, _.get(spec, "apis", []), _.isEqual);
    if (apisDiffDeletions.length || apisDiffAdditions.length) {
        let message = "\n**APIs:**\n";
        apisDiffDeletions.forEach((api) => {
            message += deletionColor(`- ${api.apiName} (${api.reason})\n`);
        });
        apisDiffAdditions.forEach((api) => {
            message += additionColor(`+ ${api.apiName} (${api.reason})\n`);
        });
        message += "Do you wish to continue?";
        await getConsent("apis", marked(message));
    }
    const resourcesDiffDeletions = _.differenceWith(spec.resources, _.get(newSpec, "resources", []), compareResources);
    const resourcesDiffAdditions = _.differenceWith(newSpec.resources, _.get(spec, "resources", []), compareResources);
    if (resourcesDiffDeletions.length || resourcesDiffAdditions.length) {
        let message = "\n**Resources:**\n";
        resourcesDiffDeletions.forEach((resource) => {
            message += deletionColor(` - ${getResourceReadableName(resource)}`);
        });
        resourcesDiffAdditions.forEach((resource) => {
            message += additionColor(`+ ${getResourceReadableName(resource)}`);
        });
        message += "Do you wish to continue?";
        await getConsent("resources", marked(message));
    }
    const rolesDiffDeletions = _.differenceWith(spec.roles, _.get(newSpec, "roles", []), _.isEqual);
    const rolesDiffAdditions = _.differenceWith(newSpec.roles, _.get(spec, "roles", []), _.isEqual);
    if (rolesDiffDeletions.length || rolesDiffAdditions.length) {
        let message = "\n**Permissions:**\n";
        rolesDiffDeletions.forEach((role) => {
            message += deletionColor(`- ${role.role} (${role.reason})\n`);
        });
        rolesDiffAdditions.forEach((role) => {
            message += additionColor(`+ ${role.role} (${role.reason})\n`);
        });
        message += "Do you wish to continue?";
        await getConsent("apis", marked(message));
    }
    if (!spec.billingRequired && newSpec.billingRequired) {
        await getConsent("billingRequired", "Billing is now required for the new version of this extension. Would you like to continue?");
    }
}
exports.displayUpdateChangesRequiringConfirmation = displayUpdateChangesRequiringConfirmation;
function compareResources(resource1, resource2) {
    return resource1.name == resource2.name && resource1.type == resource2.type;
}
function getResourceReadableName(resource) {
    return resource.type === "firebaseextensions.v1beta.function"
        ? `${resource.name} (Cloud Function): ${resource.description}\n`
        : `${resource.name} (${resource.type})\n`;
}
async function getConsent(field, message) {
    const consent = await prompt_1.promptOnce({
        type: "confirm",
        message,
        default: true,
    });
    if (!consent) {
        throw new error_1.FirebaseError(`Without explicit consent for the change to ${field}, we cannot update this extension instance.`, { exit: 2 });
    }
}
exports.getConsent = getConsent;
