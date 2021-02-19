"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseType = void 0;
const api = require("../api");
const logger = require("../logger");
async function checkDatabaseType(projectId) {
    try {
        const resp = await api.request("GET", "/v1/apps/" + projectId, {
            auth: true,
            origin: api.appengineOrigin,
        });
        return resp.body.databaseType;
    }
    catch (err) {
        logger.debug("error getting database type", err);
        return undefined;
    }
}
exports.checkDatabaseType = checkDatabaseType;
