"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addServiceAccountToRoles = exports.setIamPolicy = exports.getIamPolicy = exports.firebaseRoles = void 0;
const lodash_1 = require("lodash");
const api = require("../api");
const iam_1 = require("./iam");
const API_VERSION = "v1";
exports.firebaseRoles = {
    apiKeysViewer: "roles/serviceusage.apiKeysViewer",
    authAdmin: "roles/firebaseauth.admin",
    hostingAdmin: "roles/firebasehosting.admin",
    runViewer: "roles/run.viewer",
};
async function getIamPolicy(projectId) {
    const response = await api.request("POST", `/${API_VERSION}/projects/${projectId}:getIamPolicy`, {
        auth: true,
        origin: api.resourceManagerOrigin,
    });
    return response.body;
}
exports.getIamPolicy = getIamPolicy;
async function setIamPolicy(projectId, newPolicy, updateMask) {
    const response = await api.request("POST", `/${API_VERSION}/projects/${projectId}:setIamPolicy`, {
        auth: true,
        origin: api.resourceManagerOrigin,
        data: {
            policy: newPolicy,
            updateMask: updateMask,
        },
    });
    return response.body;
}
exports.setIamPolicy = setIamPolicy;
async function addServiceAccountToRoles(projectId, serviceAccountName, roles) {
    const [{ name: fullServiceAccountName }, projectPolicy] = await Promise.all([
        iam_1.getServiceAccount(projectId, serviceAccountName),
        getIamPolicy(projectId),
    ]);
    const newMemberName = `serviceAccount:${fullServiceAccountName.split("/").pop()}`;
    roles.forEach((roleName) => {
        let bindingIndex = lodash_1.findIndex(projectPolicy.bindings, (binding) => binding.role === roleName);
        if (bindingIndex === -1) {
            bindingIndex =
                projectPolicy.bindings.push({
                    role: roleName,
                    members: [],
                }) - 1;
        }
        const binding = projectPolicy.bindings[bindingIndex];
        if (!binding.members.includes(newMemberName)) {
            binding.members.push(newMemberName);
        }
    });
    return setIamPolicy(projectId, projectPolicy, "bindings");
}
exports.addServiceAccountToRoles = addServiceAccountToRoles;
