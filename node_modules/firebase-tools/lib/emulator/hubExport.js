"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubExport = void 0;
const path = require("path");
const fs = require("fs");
const http = require("http");
const api = require("../api");
const logger = require("../logger");
const types_1 = require("./types");
const registry_1 = require("./registry");
const error_1 = require("../error");
const hub_1 = require("./hub");
const downloadableEmulators_1 = require("./downloadableEmulators");
class HubExport {
    constructor(projectId, exportPath) {
        this.projectId = projectId;
        this.exportPath = exportPath;
    }
    static readMetadata(exportPath) {
        const metadataPath = path.join(exportPath, this.METADATA_FILE_NAME);
        if (!fs.existsSync(metadataPath)) {
            return undefined;
        }
        return JSON.parse(fs.readFileSync(metadataPath, "utf8").toString());
    }
    async exportAll() {
        const toExport = types_1.ALL_EMULATORS.filter(shouldExport);
        if (toExport.length === 0) {
            throw new error_1.FirebaseError("No running emulators support import/export.");
        }
        const metadata = {
            version: hub_1.EmulatorHub.CLI_VERSION,
        };
        if (shouldExport(types_1.Emulators.FIRESTORE)) {
            metadata.firestore = {
                version: downloadableEmulators_1.getDownloadDetails(types_1.Emulators.FIRESTORE).version,
                path: "firestore_export",
                metadata_file: "firestore_export/firestore_export.overall_export_metadata",
            };
            await this.exportFirestore(metadata);
        }
        if (shouldExport(types_1.Emulators.DATABASE)) {
            metadata.database = {
                version: downloadableEmulators_1.getDownloadDetails(types_1.Emulators.DATABASE).version,
                path: "database_export",
            };
            await this.exportDatabase(metadata);
        }
        if (shouldExport(types_1.Emulators.AUTH)) {
            metadata.auth = {
                version: hub_1.EmulatorHub.CLI_VERSION,
                path: "auth_export",
            };
            await this.exportAuth(metadata);
        }
        const metadataPath = path.join(this.exportPath, HubExport.METADATA_FILE_NAME);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, undefined, 2));
    }
    async exportFirestore(metadata) {
        const firestoreInfo = registry_1.EmulatorRegistry.get(types_1.Emulators.FIRESTORE).getInfo();
        const firestoreHost = `http://${registry_1.EmulatorRegistry.getInfoHostString(firestoreInfo)}`;
        const firestoreExportBody = {
            database: `projects/${this.projectId}/databases/(default)`,
            export_directory: this.exportPath,
            export_name: metadata.firestore.path,
        };
        return api.request("POST", `/emulator/v1/projects/${this.projectId}:export`, {
            origin: firestoreHost,
            json: true,
            data: firestoreExportBody,
        });
    }
    async exportDatabase(metadata) {
        const databaseEmulator = registry_1.EmulatorRegistry.get(types_1.Emulators.DATABASE);
        const databaseAddr = `http://${registry_1.EmulatorRegistry.getInfoHostString(databaseEmulator.getInfo())}`;
        const inspectURL = `/.inspect/databases.json?ns=${this.projectId}`;
        const inspectRes = await api.request("GET", inspectURL, { origin: databaseAddr, auth: true });
        const namespaces = inspectRes.body.map((instance) => instance.name);
        const namespacesToExport = [];
        for (const ns of namespaces) {
            const checkDataPath = `/.json?ns=${ns}&shallow=true&limitToFirst=1`;
            const checkDataRes = await api.request("GET", checkDataPath, {
                origin: databaseAddr,
                auth: true,
            });
            if (checkDataRes.body !== null) {
                namespacesToExport.push(ns);
            }
            else {
                logger.debug(`Namespace ${ns} contained null data, not exporting`);
            }
        }
        for (const ns of databaseEmulator.getImportedNamespaces()) {
            if (!namespacesToExport.includes(ns)) {
                logger.debug(`Namespace ${ns} was imported, exporting.`);
                namespacesToExport.push(ns);
            }
        }
        if (!fs.existsSync(this.exportPath)) {
            fs.mkdirSync(this.exportPath);
        }
        const dbExportPath = path.join(this.exportPath, metadata.database.path);
        if (!fs.existsSync(dbExportPath)) {
            fs.mkdirSync(dbExportPath);
        }
        const { host, port } = databaseEmulator.getInfo();
        for (const ns of namespacesToExport) {
            const exportFile = path.join(dbExportPath, `${ns}.json`);
            logger.debug(`Exporting database instance: ${ns} to ${exportFile}`);
            await fetchToFile({
                host,
                port,
                path: `/.json?ns=${ns}&format=export`,
                headers: { Authorization: "Bearer owner" },
            }, exportFile);
        }
    }
    async exportAuth(metadata) {
        const { host, port } = registry_1.EmulatorRegistry.get(types_1.Emulators.AUTH).getInfo();
        const authExportPath = path.join(this.exportPath, metadata.auth.path);
        if (!fs.existsSync(authExportPath)) {
            fs.mkdirSync(authExportPath);
        }
        const accountsFile = path.join(authExportPath, "accounts.json");
        logger.debug(`Exporting auth users in Project ${this.projectId} to ${accountsFile}`);
        await fetchToFile({
            host,
            port,
            path: `/identitytoolkit.googleapis.com/v1/projects/${this.projectId}/accounts:batchGet?limit=-1`,
            headers: { Authorization: "Bearer owner" },
        }, accountsFile);
        const configFile = path.join(authExportPath, "config.json");
        logger.debug(`Exporting project config in Project ${this.projectId} to ${accountsFile}`);
        await fetchToFile({
            host,
            port,
            path: `/emulator/v1/projects/${this.projectId}/config`,
            headers: { Authorization: "Bearer owner" },
        }, configFile);
    }
}
exports.HubExport = HubExport;
HubExport.METADATA_FILE_NAME = "firebase-export-metadata.json";
function fetchToFile(options, path) {
    const writeStream = fs.createWriteStream(path);
    return new Promise((resolve, reject) => {
        http
            .get(options, (response) => {
            response.pipe(writeStream, { end: true }).once("close", resolve);
        })
            .on("error", reject);
    });
}
function shouldExport(e) {
    return types_1.IMPORT_EXPORT_EMULATORS.includes(e) && registry_1.EmulatorRegistry.isRunning(e);
}
