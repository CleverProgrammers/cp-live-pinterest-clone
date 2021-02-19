"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAuthDomains = exports.getAuthDomains = void 0;
const apiv2_1 = require("../apiv2");
const api_1 = require("../api");
const apiClient = new apiv2_1.Client({ urlPrefix: api_1.identityOrigin, auth: true });
async function getAuthDomains(project) {
    const res = await apiClient.get(`/admin/v2/projects/${project}/config`);
    return res.body.authorizedDomains;
}
exports.getAuthDomains = getAuthDomains;
async function updateAuthDomains(project, authDomains) {
    const res = await apiClient.patch(`/admin/v2/projects/${project}/config`, { authorizedDomains: authDomains }, { queryParams: { update_mask: "authorizedDomains" } });
    return res.body.authorizedDomains;
}
exports.updateAuthDomains = updateAuthDomains;
