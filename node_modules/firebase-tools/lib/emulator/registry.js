"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmulatorRegistry = void 0;
const types_1 = require("./types");
const error_1 = require("../error");
const portUtils = require("./portUtils");
const constants_1 = require("./constants");
const emulatorLogger_1 = require("./emulatorLogger");
class EmulatorRegistry {
    static async start(instance) {
        const description = constants_1.Constants.description(instance.getName());
        if (this.isRunning(instance.getName())) {
            throw new error_1.FirebaseError(`${description} is already running!`, {});
        }
        this.set(instance.getName(), instance);
        await instance.start();
        const info = instance.getInfo();
        await portUtils.waitForPortClosed(info.port, info.host);
    }
    static async stop(name) {
        emulatorLogger_1.EmulatorLogger.forEmulator(name).logLabeled("BULLET", name, `Stopping ${constants_1.Constants.description(name)}`);
        const instance = this.get(name);
        if (!instance) {
            return;
        }
        await instance.stop();
        this.clear(instance.getName());
    }
    static async stopAll() {
        const stopPriority = {
            ui: 0,
            functions: 1,
            hosting: 2,
            database: 3.0,
            firestore: 3.1,
            pubsub: 3.2,
            auth: 3.3,
            hub: 4,
            logging: 5,
        };
        const emulatorsToStop = this.listRunning().sort((a, b) => {
            return stopPriority[a] - stopPriority[b];
        });
        for (const name of emulatorsToStop) {
            try {
                await this.stop(name);
            }
            catch (e) {
                emulatorLogger_1.EmulatorLogger.forEmulator(name).logLabeled("WARN", name, `Error stopping ${constants_1.Constants.description(name)}`);
            }
        }
    }
    static isRunning(emulator) {
        const instance = this.INSTANCES.get(emulator);
        return instance !== undefined;
    }
    static listRunning() {
        return types_1.ALL_EMULATORS.filter((name) => this.isRunning(name));
    }
    static listRunningWithInfo() {
        return this.listRunning()
            .map((emulator) => this.getInfo(emulator))
            .filter((info) => typeof info !== "undefined");
    }
    static get(emulator) {
        return this.INSTANCES.get(emulator);
    }
    static getInfo(emulator) {
        const instance = this.INSTANCES.get(emulator);
        if (!instance) {
            return undefined;
        }
        return instance.getInfo();
    }
    static getInfoHostString(info) {
        const { host, port } = info;
        if (host.includes(":")) {
            return `[${host}]:${port}`;
        }
        else {
            return `${host}:${port}`;
        }
    }
    static getPort(emulator) {
        const instance = this.INSTANCES.get(emulator);
        if (!instance) {
            return undefined;
        }
        return instance.getInfo().port;
    }
    static set(emulator, instance) {
        this.INSTANCES.set(emulator, instance);
    }
    static clear(emulator) {
        this.INSTANCES.delete(emulator);
    }
}
exports.EmulatorRegistry = EmulatorRegistry;
EmulatorRegistry.INSTANCES = new Map();
