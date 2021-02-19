"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensure = exports.enable = exports.check = exports.POLL_SETTINGS = void 0;
const _ = require("lodash");
const cli_color_1 = require("cli-color");
const track = require("./track");
const api = require("./api");
const utils = require("./utils");
const error_1 = require("./error");
exports.POLL_SETTINGS = {
    pollInterval: 10000,
    pollsBeforeRetry: 12,
};
async function check(projectId, apiName, prefix, silent = false) {
    const response = await api.request("GET", `/v1/projects/${projectId}/services/${apiName}`, {
        auth: true,
        origin: api.serviceUsageOrigin,
    });
    const isEnabled = _.get(response.body, "state") === "ENABLED";
    if (isEnabled && !silent) {
        utils.logLabeledSuccess(prefix, `required API ${cli_color_1.bold(apiName)} is enabled`);
    }
    return isEnabled;
}
exports.check = check;
async function enable(projectId, apiName) {
    try {
        await api.request("POST", `/v1/projects/${projectId}/services/${apiName}:enable`, {
            auth: true,
            origin: api.serviceUsageOrigin,
        });
    }
    catch (err) {
        if (error_1.isBillingError(err)) {
            throw new error_1.FirebaseError(`Your project ${cli_color_1.bold(projectId)} must be on the Blaze (pay-as-you-go) plan to complete this command. Required API ${cli_color_1.bold(apiName)} can't be enabled until the upgrade is complete. To upgrade, visit the following URL:

https://console.firebase.google.com/project/${projectId}/usage/details`);
        }
        throw err;
    }
}
exports.enable = enable;
async function pollCheckEnabled(projectId, apiName, prefix, silent, enablementRetries, pollRetries = 0) {
    if (pollRetries > exports.POLL_SETTINGS.pollsBeforeRetry) {
        return enableApiWithRetries(projectId, apiName, prefix, silent, enablementRetries + 1);
    }
    await new Promise((resolve) => {
        setTimeout(resolve, exports.POLL_SETTINGS.pollInterval);
    });
    const isEnabled = await check(projectId, apiName, prefix, silent);
    if (isEnabled) {
        track("api_enabled", apiName);
        return;
    }
    if (!silent) {
        utils.logLabeledBullet(prefix, `waiting for API ${cli_color_1.bold(apiName)} to activate...`);
    }
    return pollCheckEnabled(projectId, apiName, prefix, silent, enablementRetries, pollRetries + 1);
}
async function enableApiWithRetries(projectId, apiName, prefix, silent, enablementRetries = 0) {
    if (enablementRetries > 1) {
        throw new error_1.FirebaseError(`Timed out waiting for API ${cli_color_1.bold(apiName)} to enable. Please try again in a few minutes.`);
    }
    await enable(projectId, apiName);
    return pollCheckEnabled(projectId, apiName, prefix, silent, enablementRetries);
}
async function ensure(projectId, apiName, prefix, silent = false) {
    if (!silent) {
        utils.logLabeledBullet(prefix, `ensuring required API ${cli_color_1.bold(apiName)} is enabled...`);
    }
    const isEnabled = await check(projectId, apiName, prefix, silent);
    if (isEnabled) {
        return;
    }
    if (!silent) {
        utils.logLabeledWarning(prefix, `missing required API ${cli_color_1.bold(apiName)}. Enabling now...`);
    }
    return enableApiWithRetries(projectId, apiName, prefix, silent);
}
exports.ensure = ensure;
