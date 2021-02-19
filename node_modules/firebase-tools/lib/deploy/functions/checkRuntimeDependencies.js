"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRuntimeDependencies = void 0;
const cli_color_1 = require("cli-color");
const track = require("../../track");
const ensureApiEnabled_1 = require("../../ensureApiEnabled");
const error_1 = require("../../error");
const FAQ_URL = "https://firebase.google.com/support/faq#functions-runtime";
const CLOUD_BUILD_API = "cloudbuild.googleapis.com";
function nodeBillingError(projectId) {
    track("functions_runtime_notices", "nodejs10_billing_error");
    return new error_1.FirebaseError(`Cloud Functions deployment requires the pay-as-you-go (Blaze) billing plan. To upgrade your project, visit the following URL:
      
https://console.firebase.google.com/project/${projectId}/usage/details

For additional information about this requirement, see Firebase FAQs:

${FAQ_URL}`, { exit: 1 });
}
function nodePermissionError(projectId) {
    track("functions_runtime_notices", "nodejs10_permission_error");
    return new error_1.FirebaseError(`Cloud Functions deployment requires the Cloud Build API to be enabled. The current credentials do not have permission to enable APIs for project ${cli_color_1.bold(projectId)}.

Please ask a project owner to visit the following URL to enable Cloud Build:

https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=${projectId}

For additional information about this requirement, see Firebase FAQs:
${FAQ_URL}
`);
}
function isPermissionError(e) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = e.context) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.status) === "PERMISSION_DENIED";
}
async function checkRuntimeDependencies(projectId, runtime) {
    try {
        await ensureApiEnabled_1.ensure(projectId, CLOUD_BUILD_API, "functions");
    }
    catch (e) {
        if (error_1.isBillingError(e)) {
            throw nodeBillingError(projectId);
        }
        else if (isPermissionError(e)) {
            throw nodePermissionError(projectId);
        }
        throw e;
    }
}
exports.checkRuntimeDependencies = checkRuntimeDependencies;
