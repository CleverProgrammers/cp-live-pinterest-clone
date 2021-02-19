"use strict";
/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlugin = void 0;
const BaseAbstractPlugin_1 = require("../BaseAbstractPlugin");
/** This class represent the base to patch plugin. */
class BasePlugin extends BaseAbstractPlugin_1.BaseAbstractPlugin {
    enable(moduleExports, tracerProvider, logger, config) {
        this._moduleExports = moduleExports;
        this._tracer = tracerProvider.getTracer(this._tracerName, this._tracerVersion);
        this._logger = logger;
        if (config)
            this._config = config;
        return this.patch();
    }
}
exports.BasePlugin = BasePlugin;
//# sourceMappingURL=BasePlugin.js.map