"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollbackTemplate = void 0;
const api = require("../api");
const TIMEOUT = 30000;
async function rollbackTemplate(projectId, versionNumber) {
    const requestPath = `/v1/projects/${projectId}/remoteConfig:rollback?versionNumber=${versionNumber}`;
    const response = await api.request("POST", requestPath, {
        auth: true,
        origin: api.remoteConfigApiOrigin,
        timeout: TIMEOUT,
    });
    return response.body;
}
exports.rollbackTemplate = rollbackTemplate;
