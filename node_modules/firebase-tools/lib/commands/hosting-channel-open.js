"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const cli_color_1 = require("cli-color");
const open = require("open");
const command_1 = require("../command");
const error_1 = require("../error");
const api_1 = require("../hosting/api");
const requirePermissions_1 = require("../requirePermissions");
const getProjectId = require("../getProjectId");
const requireConfig = require("../requireConfig");
const utils_1 = require("../utils");
const prompt_1 = require("../prompt");
const requireHostingSite_1 = require("../requireHostingSite");
exports.default = new command_1.Command("hosting:channel:open [channelId]")
    .description("opens the URL for a Firebase Hosting channel")
    .help("if unable to open the URL in a browser, it will be displayed in the output")
    .option("--site <siteId>", "the site to which the channel belongs")
    .before(requireConfig)
    .before(requirePermissions_1.requirePermissions, ["firebasehosting.sites.get"])
    .before(requireHostingSite_1.requireHostingSite)
    .action(async (channelId, options) => {
    const projectId = getProjectId(options);
    const siteId = options.site;
    if (!channelId) {
        if (options.nonInteractive) {
            throw new error_1.FirebaseError(`Please provide a channelId.`);
        }
        const channels = await api_1.listChannels(projectId, siteId);
        lodash_1.sortBy(channels, ["name"]);
        channelId = await prompt_1.promptOnce({
            type: "list",
            message: "Which channel would you like to open?",
            choices: channels.map((c) => lodash_1.last(c.name.split("/")) || c.name),
        });
    }
    channelId = api_1.normalizeName(channelId);
    const channel = await api_1.getChannel(projectId, siteId, channelId);
    if (!channel) {
        throw new error_1.FirebaseError(`Could not find the channel ${cli_color_1.bold(channelId)} for site ${cli_color_1.bold(siteId)}.`);
    }
    utils_1.logLabeledBullet("hosting:channel", channel.url);
    if (!options.nonInteractive) {
        open(channel.url);
    }
    return { url: channel.url };
});
