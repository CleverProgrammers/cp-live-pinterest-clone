"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultHostingSite = void 0;
const logger = require("./logger");
const projects_1 = require("./management/projects");
async function getDefaultHostingSite(options) {
    var _a;
    const project = await projects_1.getFirebaseProject(options.project);
    const site = (_a = project.resources) === null || _a === void 0 ? void 0 : _a.hostingSite;
    if (!site) {
        logger.debug(`No default hosting site found for project: ${options.project}. Using projectId as hosting site name.`);
        return options.project;
    }
    return site;
}
exports.getDefaultHostingSite = getDefaultHostingSite;
