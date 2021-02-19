"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptForPublisherTOS = exports.prompt = exports.retrieveRoleInfo = exports.formatDescription = void 0;
const _ = require("lodash");
const clc = require("cli-color");
const marked = require("marked");
const TerminalRenderer = require("marked-terminal");
const error_1 = require("../error");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const iam = require("../gcp/iam");
const prompt_1 = require("../prompt");
const utils = require("../utils");
marked.setOptions({
    renderer: new TerminalRenderer(),
});
async function formatDescription(extensionName, projectId, roles) {
    const question = `${clc.bold(extensionName)} will be granted the following access to project ${clc.bold(projectId)}`;
    const results = await Promise.all(roles.map((role) => {
        return retrieveRoleInfo(role);
    }));
    results.unshift(question);
    return _.join(results, "\n");
}
exports.formatDescription = formatDescription;
async function retrieveRoleInfo(role) {
    const res = await iam.getRole(role);
    return `- ${res.title} (${res.description})`;
}
exports.retrieveRoleInfo = retrieveRoleInfo;
async function prompt(extensionName, projectId, roles) {
    if (!roles || !roles.length) {
        return;
    }
    const message = await formatDescription(extensionName, projectId, roles);
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, message);
    const question = {
        name: "consent",
        type: "confirm",
        message: "Would you like to continue?",
        default: true,
    };
    const consented = await prompt_1.promptOnce(question);
    if (!consented) {
        throw new error_1.FirebaseError("Without explicit consent for the roles listed, we cannot deploy this extension.");
    }
}
exports.prompt = prompt;
async function promptForPublisherTOS() {
    const termsOfServiceMsg = "By registering as a publisher, you confirm that you have read the Firebase Extensions Publisher Terms and Conditions (linked below) and you, on behalf of yourself and the organization you represent, agree to comply with it.  Here is a brief summary of the highlights of our terms and conditions:\n" +
        "  - You ensure extensions you publish comply with all laws and regulations; do not include any viruses, spyware, Trojan horses, or other malicious code; and do not violate any person’s rights, including intellectual property, privacy, and security rights.\n" +
        "  - You will not engage in any activity that interferes with or accesses in an unauthorized manner the properties or services of Google, Google’s affiliates, or any third party.\n" +
        "  - If you become aware or should be aware of a critical security issue in your extension, you will provide either a resolution or a written resolution plan within 48 hours.\n" +
        "  - If Google requests a critical security matter to be patched for your extension, you will respond to Google within 48 hours with either a resolution or a written resolution plan.\n" +
        "  - Google may remove your extension or terminate the agreement, if you violate any terms.";
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, marked(termsOfServiceMsg));
    const question = {
        name: "consent",
        type: "confirm",
        message: marked("Do you accept the [Firebase Extensions Publisher Terms and Conditions](https://firebase.google.com/docs/extensions/alpha/terms-of-service) and acknowledge that your information will be used in accordance with [Google's Privacy Policy](https://policies.google.com/privacy?hl=en)?"),
        default: false,
    };
    const consented = await prompt_1.promptOnce(question);
    if (!consented) {
        throw new error_1.FirebaseError("You must agree to the terms of service to register a publisher ID.", {
            exit: 1,
        });
    }
}
exports.promptForPublisherTOS = promptForPublisherTOS;
