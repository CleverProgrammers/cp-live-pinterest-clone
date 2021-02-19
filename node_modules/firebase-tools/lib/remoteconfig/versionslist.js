"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVersions = void 0;
const api = require("../api");
const error_1 = require("../error");
const logger = require("../logger");
const TIMEOUT = 30000;
async function getVersions(projectId, maxResults = 10) {
    maxResults = maxResults || 300;
    try {
        let request = `/v1/projects/${projectId}/remoteConfig:listVersions`;
        if (maxResults) {
            request = request + "?pageSize=" + maxResults;
        }
        const response = await api.request("GET", request, {
            auth: true,
            origin: api.remoteConfigApiOrigin,
            timeout: TIMEOUT,
        });
        return response.body;
    }
    catch (err) {
        logger.debug(err.message);
        throw new error_1.FirebaseError(`Failed to get Remote Config template versions for Firebase project ${projectId}. `, { exit: 2, original: err });
    }
}
exports.getVersions = getVersions;
