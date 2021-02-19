"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmulatorHub = void 0;
const express = require("express");
const os = require("os");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const utils = require("../utils");
const logger = require("../logger");
const constants_1 = require("./constants");
const types_1 = require("./types");
const hubExport_1 = require("./hubExport");
const registry_1 = require("./registry");
const pkg = require("../../package.json");
class EmulatorHub {
    constructor(args) {
        this.args = args;
        this.hub = express();
        this.hub.use(bodyParser.json());
        this.hub.get("/", (req, res) => {
            res.json(this.getLocator());
        });
        this.hub.get(EmulatorHub.PATH_EMULATORS, (req, res) => {
            const body = {};
            registry_1.EmulatorRegistry.listRunning().forEach((name) => {
                body[name] = registry_1.EmulatorRegistry.get(name).getInfo();
            });
            res.json(body);
        });
        this.hub.post(EmulatorHub.PATH_EXPORT, async (req, res) => {
            const exportPath = req.body.path;
            utils.logLabeledBullet("emulators", `Received export request. Exporting data to ${exportPath}.`);
            try {
                await new hubExport_1.HubExport(this.args.projectId, exportPath).exportAll();
                utils.logLabeledSuccess("emulators", "Export complete.");
                res.status(200).send({
                    message: "OK",
                });
            }
            catch (e) {
                const errorString = e.message || JSON.stringify(e);
                utils.logLabeledWarning("emulators", `Export failed: ${errorString}`);
                res.status(500).json({
                    message: errorString,
                });
            }
        });
        this.hub.put(EmulatorHub.PATH_DISABLE_FUNCTIONS, (req, res) => {
            utils.logLabeledBullet("emulators", `Disabling Cloud Functions triggers, non-HTTP functions will not execute.`);
            const instance = registry_1.EmulatorRegistry.get(types_1.Emulators.FUNCTIONS);
            if (!instance) {
                res.status(400).json({ error: "The Cloud Functions emulator is not running." });
                return;
            }
            const emu = instance;
            emu.disableBackgroundTriggers();
            res.status(200).json({ enabled: false });
        });
        this.hub.put(EmulatorHub.PATH_ENABLE_FUNCTIONS, async (req, res) => {
            utils.logLabeledBullet("emulators", `Enabling Cloud Functions triggers, non-HTTP functions will execute.`);
            const instance = registry_1.EmulatorRegistry.get(types_1.Emulators.FUNCTIONS);
            if (!instance) {
                res.status(400).send("The Cloud Functions emulator is not running.");
                return;
            }
            const emu = instance;
            await emu.reloadTriggers();
            res.status(200).json({ enabled: true });
        });
    }
    static readLocatorFile(projectId) {
        const locatorPath = this.getLocatorFilePath(projectId);
        if (!fs.existsSync(locatorPath)) {
            return undefined;
        }
        const data = fs.readFileSync(locatorPath, "utf8").toString();
        const locator = JSON.parse(data);
        if (locator.version !== this.CLI_VERSION) {
            logger.debug(`Found locator with mismatched version, ignoring: ${JSON.stringify(locator)}`);
            return undefined;
        }
        return locator;
    }
    static getLocatorFilePath(projectId) {
        const dir = os.tmpdir();
        const filename = `hub-${projectId}.json`;
        return path.join(dir, filename);
    }
    async start() {
        const { host, port } = this.getInfo();
        const server = this.hub.listen(port, host);
        this.destroyServer = utils.createDestroyer(server);
        await this.writeLocatorFile();
    }
    async connect() {
    }
    async stop() {
        if (this.destroyServer) {
            await this.destroyServer();
        }
        await this.deleteLocatorFile();
    }
    getInfo() {
        const host = this.args.host || constants_1.Constants.getDefaultHost(types_1.Emulators.HUB);
        const port = this.args.port || constants_1.Constants.getDefaultPort(types_1.Emulators.HUB);
        return {
            name: this.getName(),
            host,
            port,
        };
    }
    getName() {
        return types_1.Emulators.HUB;
    }
    getLocator() {
        const { host, port } = this.getInfo();
        const version = pkg.version;
        return {
            version,
            host,
            port,
        };
    }
    async writeLocatorFile() {
        const projectId = this.args.projectId;
        const locatorPath = EmulatorHub.getLocatorFilePath(projectId);
        const locator = this.getLocator();
        if (fs.existsSync(locatorPath)) {
            utils.logLabeledWarning("emulators", `It seems that you are running multiple instances of the emulator suite for project ${projectId}. This may result in unexpected behavior.`);
        }
        logger.debug(`[hub] writing locator at ${locatorPath}`);
        return new Promise((resolve, reject) => {
            fs.writeFile(locatorPath, JSON.stringify(locator), (e) => {
                if (e) {
                    reject(e);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async deleteLocatorFile() {
        const locatorPath = EmulatorHub.getLocatorFilePath(this.args.projectId);
        return new Promise((resolve, reject) => {
            fs.unlink(locatorPath, (e) => {
                if (e) {
                    reject(e);
                }
                else {
                    resolve();
                }
            });
        });
    }
}
exports.EmulatorHub = EmulatorHub;
EmulatorHub.CLI_VERSION = pkg.version;
EmulatorHub.PATH_EXPORT = "/_admin/export";
EmulatorHub.PATH_DISABLE_FUNCTIONS = "/functions/disableBackgroundTriggers";
EmulatorHub.PATH_ENABLE_FUNCTIONS = "/functions/enableBackgroundTriggers";
EmulatorHub.PATH_EMULATORS = "/emulators";
