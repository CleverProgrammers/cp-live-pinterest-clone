"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_color_1 = require("cli-color");
const Table = require("cli-table");
const api_1 = require("../hosting/api");
const command_1 = require("../command");
const requirePermissions_1 = require("../requirePermissions");
const getProjectId = require("../getProjectId");
const logger = require("../logger");
const requireConfig = require("../requireConfig");
const utils_1 = require("../utils");
const requireHostingSite_1 = require("../requireHostingSite");
const TABLE_HEAD = ["Channel ID", "Last Release Time", "URL", "Expire Time"];
exports.default = new command_1.Command("hosting:channel:list")
    .description("list all Firebase Hosting channels for your project")
    .option("--site <siteName>", "list channels for the specified site")
    .before(requireConfig)
    .before(requirePermissions_1.requirePermissions, ["firebasehosting.sites.update"])
    .before(requireHostingSite_1.requireHostingSite)
    .action(async (options) => {
    const projectId = getProjectId(options);
    const siteId = options.site;
    const channels = await api_1.listChannels(projectId, siteId);
    const table = new Table({ head: TABLE_HEAD, style: { head: ["green"] } });
    for (const channel of channels) {
        const channelId = channel.name.split("/").pop();
        table.push([
            channelId,
            utils_1.datetimeString(new Date(channel.updateTime)),
            channel.url,
            channel.expireTime ? utils_1.datetimeString(new Date(channel.expireTime)) : "never",
        ]);
    }
    logger.info();
    logger.info(`Channels for site ${cli_color_1.bold(siteId)}`);
    logger.info();
    logger.info(table.toString());
    return { channels };
});
