"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ask = exports.getInquirerDefault = exports.askForParam = exports.checkResponse = void 0;
const _ = require("lodash");
const clc = require("cli-color");
const marked = require("marked");
const extensionsApi_1 = require("./extensionsApi");
const extensionsHelper_1 = require("./extensionsHelper");
const utils_1 = require("./utils");
const logger = require("../logger");
const prompt_1 = require("../prompt");
const utils = require("../utils");
function checkResponse(response, spec) {
    let valid = true;
    let responses;
    if (spec.required && !response) {
        utils.logWarning(`Param ${spec.param} is required, but no value was provided.`);
        return false;
    }
    if (spec.type === extensionsApi_1.ParamType.MULTISELECT) {
        responses = response.split(",");
    }
    else {
        responses = [response];
    }
    if (spec.validationRegex && !!response) {
        const re = new RegExp(spec.validationRegex);
        _.forEach(responses, (resp) => {
            if ((spec.required || resp !== "") && !re.test(resp)) {
                const genericWarn = `${resp} is not a valid value for ${spec.param} since it` +
                    ` does not meet the requirements of the regex validation: "${spec.validationRegex}"`;
                utils.logWarning(spec.validationErrorMessage || genericWarn);
                valid = false;
            }
        });
    }
    if (spec.type && (spec.type === extensionsApi_1.ParamType.MULTISELECT || spec.type === extensionsApi_1.ParamType.SELECT)) {
        _.forEach(responses, (r) => {
            const validChoice = _.some(spec.options, (option) => {
                return r === option.value;
            });
            if (!validChoice) {
                utils.logWarning(`${r} is not a valid option for ${spec.param}.`);
                valid = false;
            }
        });
    }
    return valid;
}
exports.checkResponse = checkResponse;
async function askForParam(paramSpec) {
    let valid = false;
    let response = "";
    const description = paramSpec.description || "";
    const label = paramSpec.label.trim();
    logger.info(`\n${clc.bold(label)}${clc.bold(paramSpec.required ? "" : " (Optional)")}: ${marked(description).trim()}`);
    while (!valid) {
        switch (paramSpec.type) {
            case extensionsApi_1.ParamType.SELECT:
                response = await prompt_1.promptOnce({
                    name: "input",
                    type: "list",
                    default: () => {
                        if (paramSpec.default) {
                            return getInquirerDefault(_.get(paramSpec, "options", []), paramSpec.default);
                        }
                    },
                    message: "Which option do you want enabled for this parameter? " +
                        "Select an option with the arrow keys, and use Enter to confirm your choice. " +
                        "You may only select one option.",
                    choices: utils_1.convertExtensionOptionToLabeledList(paramSpec.options),
                });
                break;
            case extensionsApi_1.ParamType.MULTISELECT:
                response = await utils_1.onceWithJoin({
                    name: "input",
                    type: "checkbox",
                    default: () => {
                        if (paramSpec.default) {
                            const defaults = paramSpec.default.split(",");
                            return defaults.map((def) => {
                                return getInquirerDefault(_.get(paramSpec, "options", []), def);
                            });
                        }
                    },
                    message: "Which options do you want enabled for this parameter? " +
                        "Press Space to select, then Enter to confirm your choices. " +
                        "You may select multiple options.",
                    choices: utils_1.convertExtensionOptionToLabeledList(paramSpec.options),
                });
                break;
            default:
                response = await prompt_1.promptOnce({
                    name: paramSpec.param,
                    type: "input",
                    default: paramSpec.default,
                    message: `Enter a value for ${label}:`,
                });
        }
        valid = checkResponse(response, paramSpec);
    }
    return response;
}
exports.askForParam = askForParam;
function getInquirerDefault(options, def) {
    const defaultOption = _.find(options, (option) => {
        return option.value === def;
    });
    return defaultOption ? defaultOption.label || defaultOption.value : "";
}
exports.getInquirerDefault = getInquirerDefault;
async function ask(paramSpecs, firebaseProjectParams) {
    if (_.isEmpty(paramSpecs)) {
        logger.debug("No params were specified for this extension.");
        return {};
    }
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, "answer the questions below to configure your extension:");
    const substituted = extensionsHelper_1.substituteParams(paramSpecs, firebaseProjectParams);
    const result = {};
    const promises = _.map(substituted, (paramSpec) => {
        return async () => {
            result[paramSpec.param] = await askForParam(paramSpec);
        };
    });
    await promises.reduce((prev, cur) => prev.then(cur), Promise.resolve());
    logger.info();
    return result;
}
exports.ask = ask;
