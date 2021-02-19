"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clc = require("cli-color");
const marked = require("marked");
const command_1 = require("../command");
const extensionsApi_1 = require("../extensions/extensionsApi");
const getProjectId = require("../getProjectId");
const prompt_1 = require("../prompt");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const askUserForConsent_1 = require("../extensions/askUserForConsent");
const requirePermissions_1 = require("../requirePermissions");
const error_1 = require("../error");
const utils = require("../utils");
exports.default = new command_1.Command("ext:dev:register")
    .description("register a publisher ID; run this before publishing your first extension.")
    .before(requirePermissions_1.requirePermissions, ["firebaseextensions.sources.create"])
    .before(extensionsHelper_1.ensureExtensionsApiEnabled)
    .action(async (options) => {
    await askUserForConsent_1.promptForPublisherTOS();
    const projectId = getProjectId(options, false);
    const msg = "What would you like to register as your publisher ID? " +
        "This value identifies you in Firebase's registry of extensions as the author of your extensions. " +
        "Examples: my-company-name, MyGitHubUsername. If you are a member of the Extensions EAP group, your published extensions will only be accessible to other members of the EAP group. \n\n" +
        "You can only do this once for each project.";
    const publisherId = await prompt_1.promptOnce({
        name: "publisherId",
        type: "input",
        message: msg,
        default: projectId,
    });
    try {
        await extensionsApi_1.registerPublisherProfile(projectId, publisherId);
    }
    catch (err) {
        if (err.status === 409) {
            const error = `Couldn't register the publisher ID '${clc.bold(publisherId)}' to the project '${clc.bold(projectId)}'.` +
                " This can happen for either of two reasons:\n\n" +
                ` - Publisher ID '${clc.bold(publisherId)}' is registered to another project\n` +
                ` - Project '${clc.bold(projectId)}' already has a publisher ID\n\n` +
                ` Try again with a unique publisher ID or a new project. If your business’s name has been registered to another project, contact Firebase support ${marked("(https://firebase.google.com/support/troubleshooter/contact).")}`;
            throw new error_1.FirebaseError(error, { exit: 1 });
        }
        throw new error_1.FirebaseError(`Failed to register publisher ID ${clc.bold(publisherId)} for project ${clc.bold(projectId)}: ${err.message}`, { exit: 1 });
    }
    return utils.logLabeledSuccess(extensionsHelper_1.logPrefix, `Publisher ID '${clc.bold(publisherId)}' has been registered to project ${clc.bold(projectId)}`);
});
