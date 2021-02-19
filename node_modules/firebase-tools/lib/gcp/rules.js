"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRuleset = exports.updateOrCreateRelease = exports.updateRelease = exports.createRelease = exports.createRuleset = exports.deleteRuleset = exports.getRulesetId = exports.listAllRulesets = exports.listRulesets = exports.getRulesetContent = exports.listAllReleases = exports.listReleases = exports.getLatestRulesetName = void 0;
const _ = require("lodash");
const api = require("../api");
const logger = require("../logger");
const utils = require("../utils");
const API_VERSION = "v1";
function _handleErrorResponse(response) {
    if (response.body && response.body.error) {
        return utils.reject(response.body.error, { code: 2 });
    }
    logger.debug("[rules] error:", response.status, response.body);
    return utils.reject("Unexpected error encountered with rules.", {
        code: 2,
    });
}
async function getLatestRulesetName(projectId, service) {
    const releases = await listAllReleases(projectId);
    const prefix = `projects/${projectId}/releases/${service}`;
    const release = _.find(releases, (r) => r.name.indexOf(prefix) === 0);
    if (!release) {
        return null;
    }
    return release.rulesetName;
}
exports.getLatestRulesetName = getLatestRulesetName;
const MAX_RELEASES_PAGE_SIZE = 10;
async function listReleases(projectId, pageToken) {
    const response = await api.request("GET", `/${API_VERSION}/projects/${projectId}/releases`, {
        auth: true,
        origin: api.rulesOrigin,
        query: {
            pageSize: MAX_RELEASES_PAGE_SIZE,
            pageToken,
        },
    });
    if (response.status === 200) {
        return response.body;
    }
    return _handleErrorResponse(response);
}
exports.listReleases = listReleases;
async function listAllReleases(projectId) {
    let pageToken;
    let releases = [];
    do {
        const response = await listReleases(projectId, pageToken);
        if (response.releases && response.releases.length > 0) {
            releases = releases.concat(response.releases);
        }
        pageToken = response.nextPageToken;
    } while (pageToken);
    return _.orderBy(releases, ["createTime"], ["desc"]);
}
exports.listAllReleases = listAllReleases;
async function getRulesetContent(name) {
    const response = await api.request("GET", `/${API_VERSION}/${name}`, {
        auth: true,
        origin: api.rulesOrigin,
    });
    if (response.status === 200) {
        const source = response.body.source;
        return source.files;
    }
    return _handleErrorResponse(response);
}
exports.getRulesetContent = getRulesetContent;
const MAX_RULESET_PAGE_SIZE = 100;
async function listRulesets(projectId, pageToken) {
    const response = await api.request("GET", `/${API_VERSION}/projects/${projectId}/rulesets`, {
        auth: true,
        origin: api.rulesOrigin,
        query: {
            pageSize: MAX_RULESET_PAGE_SIZE,
            pageToken,
        },
    });
    if (response.status === 200) {
        return response.body;
    }
    return _handleErrorResponse(response);
}
exports.listRulesets = listRulesets;
async function listAllRulesets(projectId) {
    let pageToken;
    let rulesets = [];
    do {
        const response = await listRulesets(projectId, pageToken);
        if (response.rulesets) {
            rulesets = rulesets.concat(response.rulesets);
        }
        pageToken = response.nextPageToken;
    } while (pageToken);
    return _.orderBy(rulesets, ["createTime"], ["desc"]);
}
exports.listAllRulesets = listAllRulesets;
function getRulesetId(ruleset) {
    return ruleset.name.split("/").pop();
}
exports.getRulesetId = getRulesetId;
async function deleteRuleset(projectId, id) {
    const response = await api.request("DELETE", `/${API_VERSION}/projects/${projectId}/rulesets/${id}`, {
        auth: true,
        origin: api.rulesOrigin,
    });
    if (response.status === 200) {
        return;
    }
    return _handleErrorResponse(response);
}
exports.deleteRuleset = deleteRuleset;
async function createRuleset(projectId, files) {
    const payload = { source: { files } };
    const response = await api.request("POST", `/${API_VERSION}/projects/${projectId}/rulesets`, {
        auth: true,
        data: payload,
        origin: api.rulesOrigin,
    });
    if (response.status === 200) {
        logger.debug("[rules] created ruleset", response.body.name);
        return response.body.name;
    }
    return _handleErrorResponse(response);
}
exports.createRuleset = createRuleset;
async function createRelease(projectId, rulesetName, releaseName) {
    const payload = {
        name: `projects/${projectId}/releases/${releaseName}`,
        rulesetName,
    };
    const response = await api.request("POST", `/${API_VERSION}/projects/${projectId}/releases`, {
        auth: true,
        data: payload,
        origin: api.rulesOrigin,
    });
    if (response.status === 200) {
        logger.debug("[rules] created release", response.body.name);
        return response.body.name;
    }
    return _handleErrorResponse(response);
}
exports.createRelease = createRelease;
async function updateRelease(projectId, rulesetName, releaseName) {
    const payload = {
        release: {
            name: `projects/${projectId}/releases/${releaseName}`,
            rulesetName,
        },
    };
    const response = await api.request("PATCH", `/${API_VERSION}/projects/${projectId}/releases/${releaseName}`, {
        auth: true,
        data: payload,
        origin: api.rulesOrigin,
    });
    if (response.status === 200) {
        logger.debug("[rules] updated release", response.body.name);
        return response.body.name;
    }
    return _handleErrorResponse(response);
}
exports.updateRelease = updateRelease;
async function updateOrCreateRelease(projectId, rulesetName, releaseName) {
    logger.debug("[rules] releasing", releaseName, "with ruleset", rulesetName);
    return updateRelease(projectId, rulesetName, releaseName).catch(() => {
        logger.debug("[rules] ruleset update failed, attempting to create instead");
        return createRelease(projectId, rulesetName, releaseName);
    });
}
exports.updateOrCreateRelease = updateOrCreateRelease;
function testRuleset(projectId, files) {
    return api.request("POST", `/${API_VERSION}/projects/${encodeURIComponent(projectId)}:test`, {
        origin: api.rulesOrigin,
        data: {
            source: { files },
        },
        auth: true,
    });
}
exports.testRuleset = testRuleset;
