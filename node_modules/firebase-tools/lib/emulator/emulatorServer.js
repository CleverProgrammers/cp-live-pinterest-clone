"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmulatorServer = void 0;
const registry_1 = require("./registry");
const portUtils = require("./portUtils");
const error_1 = require("../error");
class EmulatorServer {
    constructor(instance) {
        this.instance = instance;
    }
    async start() {
        const { port, host } = this.instance.getInfo();
        const portOpen = await portUtils.checkPortOpen(port, host);
        if (!portOpen) {
            throw new error_1.FirebaseError(`Port ${port} is not open on ${host}, could not start ${this.instance.getName()} emulator.`);
        }
        await registry_1.EmulatorRegistry.start(this.instance);
    }
    async connect() {
        await this.instance.connect();
    }
    async stop() {
        await registry_1.EmulatorRegistry.stop(this.instance.getName());
    }
    get() {
        return this.instance;
    }
}
exports.EmulatorServer = EmulatorServer;
