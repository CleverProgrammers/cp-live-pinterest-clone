"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const proxy_1 = require("./proxy");
const getProjectId = require("../getProjectId");
const registry_1 = require("../emulator/registry");
const types_1 = require("../emulator/types");
const functionsEmulator_1 = require("../emulator/functionsEmulator");
function default_1(options) {
    return (rewrite) => {
        return new Promise((resolve) => {
            const projectId = getProjectId(options, false);
            let url = `https://us-central1-${projectId}.cloudfunctions.net/${rewrite.function}`;
            let destLabel = "live";
            if (lodash_1.includes(options.targets, "functions")) {
                destLabel = "local";
                const functionsEmu = registry_1.EmulatorRegistry.get(types_1.Emulators.FUNCTIONS);
                if (functionsEmu) {
                    url = functionsEmulator_1.FunctionsEmulator.getHttpFunctionUrl(functionsEmu.getInfo().host, functionsEmu.getInfo().port, projectId, rewrite.function, "us-central1");
                }
            }
            resolve(proxy_1.proxyRequestHandler(url, `${destLabel} Function ${rewrite.function}`));
        });
    };
}
exports.default = default_1;
