"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDatabaseInstances = exports.createDatabaseInstance = void 0;
const api = require("../api");
const logger = require("../logger");
const utils = require("../utils");
function _handleErrorResponse(response) {
    if (response.body && response.body.error) {
        return utils.reject(response.body.error, { code: 2 });
    }
    logger.debug("[firedata] error:", response.status, response.body);
    return utils.reject("Unexpected error encountered with FireData.", {
        code: 2,
    });
}
async function createDatabaseInstance(projectNumber, instanceName) {
    const response = await api.request("POST", `/v1/projects/${projectNumber}/databases`, {
        auth: true,
        origin: api.firedataOrigin,
        json: {
            instance: instanceName,
        },
    });
    if (response.status === 200) {
        return response.body.instance;
    }
    return _handleErrorResponse(response);
}
exports.createDatabaseInstance = createDatabaseInstance;
async function listDatabaseInstances(projectNumber) {
    const response = await api.request("GET", `/v1/projects/${projectNumber}/databases`, {
        auth: true,
        origin: api.firedataOrigin,
    });
    if (response.status === 200) {
        return response.body.instance;
    }
    return _handleErrorResponse(response);
}
exports.listDatabaseInstances = listDatabaseInstances;
