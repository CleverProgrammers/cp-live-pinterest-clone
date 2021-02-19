"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listExtensions = void 0;
const _ = require("lodash");
const clc = require("cli-color");
const Table = require("cli-table");
const extensionsApi_1 = require("./extensionsApi");
const extensionsHelper_1 = require("./extensionsHelper");
const utils = require("../utils");
const extensionsUtils = require("./utils");
const logger = require("../logger");
async function listExtensions(projectId) {
    const instances = await extensionsApi_1.listInstances(projectId);
    if (instances.length < 1) {
        utils.logLabeledBullet(extensionsHelper_1.logPrefix, `there are no extensions installed on project ${clc.bold(projectId)}.`);
        return { instances: [] };
    }
    const table = new Table({
        head: ["Extension", "Author", "Instance ID", "State", "Version", "Your last update"],
        style: { head: ["yellow"] },
    });
    const sorted = _.sortBy(instances, "createTime", "asc").reverse();
    sorted.forEach((instance) => {
        let extension = _.get(instance, "config.extensionRef", "");
        if (extension === "") {
            extension = _.get(instance, "config.source.spec.name", "");
        }
        table.push([
            extension,
            _.get(instance, "config.source.spec.author.authorName", ""),
            _.last(instance.name.split("/")),
            instance.state +
                (_.get(instance, "config.source.state", "ACTIVE") === "DELETED" ? " (UNPUBLISHED)" : ""),
            _.get(instance, "config.source.spec.version", ""),
            extensionsUtils.formatTimestamp(instance.updateTime),
        ]);
    });
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, `list of extensions installed in ${clc.bold(projectId)}:`);
    logger.info(table.toString());
    return { instances: sorted };
}
exports.listExtensions = listExtensions;
