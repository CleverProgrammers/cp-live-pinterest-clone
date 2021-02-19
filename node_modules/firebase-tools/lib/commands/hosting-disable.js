"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clc = require("cli-color");
const apiv2_1 = require("../apiv2");
const command_1 = require("../command");
const api_1 = require("../api");
const prompt_1 = require("../prompt");
const requireHostingSite_1 = require("../requireHostingSite");
const requirePermissions_1 = require("../requirePermissions");
const utils = require("../utils");
exports.default = new command_1.Command("hosting:disable")
    .description("stop serving web traffic to your Firebase Hosting site")
    .option("-y, --confirm", "skip confirmation")
    .option("-s, --site <siteName>", "the site to disable")
    .before(requirePermissions_1.requirePermissions, ["firebasehosting.sites.update"])
    .before(requireHostingSite_1.requireHostingSite)
    .action(async (options) => {
    let confirm = Boolean(options.confirm);
    const siteToDisable = options.site;
    if (!confirm) {
        confirm = await prompt_1.promptOnce({
            type: "confirm",
            name: "confirm",
            message: `Are you sure you want to disable Firebase Hosting for the site ${clc.underline(siteToDisable)}\n${clc.underline("This will immediately make your site inaccessible!")}`,
        });
    }
    if (!confirm) {
        return;
    }
    const c = new apiv2_1.Client({ urlPrefix: api_1.hostingApiOrigin, apiVersion: "v1beta1", auth: true });
    await c.post(`/sites/${siteToDisable}/releases`, { type: "SITE_DISABLE" });
    utils.logSuccess(`Hosting has been disabled for ${clc.bold(siteToDisable)}. Deploy a new version to re-enable.`);
});
