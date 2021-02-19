"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const clc = require("cli-color");
const marked = require("marked");
const ora = require("ora");
const TerminalRenderer = require("marked-terminal");
const askUserForConsent = require("../extensions/askUserForConsent");
const displayExtensionInfo_1 = require("../extensions/displayExtensionInfo");
const billingMigrationHelper_1 = require("../extensions/billingMigrationHelper");
const checkProjectBilling_1 = require("../extensions/checkProjectBilling");
const checkMinRequiredVersion_1 = require("../checkMinRequiredVersion");
const command_1 = require("../command");
const error_1 = require("../error");
const getProjectId = require("../getProjectId");
const extensionsApi = require("../extensions/extensionsApi");
const resolveSource_1 = require("../extensions/resolveSource");
const paramHelper = require("../extensions/paramHelper");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const utils_1 = require("../extensions/utils");
const requirePermissions_1 = require("../requirePermissions");
const utils = require("../utils");
const logger = require("../logger");
const prompt_1 = require("../prompt");
const previews_1 = require("../previews");
marked.setOptions({
    renderer: new TerminalRenderer(),
});
async function installExtension(options) {
    const { projectId, extensionName, source, extVersion, paramFilePath } = options;
    const spec = (source === null || source === void 0 ? void 0 : source.spec) || (extVersion === null || extVersion === void 0 ? void 0 : extVersion.spec);
    if (!spec) {
        throw new error_1.FirebaseError(`Could not find the extension.yaml for ${extensionName}. Please make sure this is a valid extension and try again.`);
    }
    const spinner = ora.default("Installing your extension instance. This usually takes 3 to 5 minutes...");
    try {
        if (spec.billingRequired) {
            const enabled = await checkProjectBilling_1.isBillingEnabled(projectId);
            if (!enabled) {
                await billingMigrationHelper_1.displayNode10CreateBillingNotice(spec, false);
                await checkProjectBilling_1.enableBilling(projectId, spec.displayName || spec.name);
            }
            else {
                await billingMigrationHelper_1.displayNode10CreateBillingNotice(spec, true);
            }
        }
        const roles = spec.roles ? spec.roles.map((role) => role.role) : [];
        await askUserForConsent.prompt(spec.displayName || spec.name, projectId, roles);
        let instanceId = spec.name;
        const anotherInstanceExists = await extensionsHelper_1.instanceIdExists(projectId, instanceId);
        if (anotherInstanceExists) {
            const consent = await extensionsHelper_1.promptForRepeatInstance(projectId, spec.name);
            if (!consent) {
                logger.info(marked("Installation cancelled. For a list of all available Firebase Extensions commands, run `firebase ext`."));
                return;
            }
            instanceId = await extensionsHelper_1.promptForValidInstanceId(`${instanceId}-${utils_1.getRandomString(4)}`);
        }
        const params = await paramHelper.getParams(projectId, _.get(spec, "params", []), paramFilePath);
        spinner.start();
        if (!source && extVersion) {
            await extensionsApi.createInstanceFromExtensionVersion(projectId, instanceId, extVersion, params);
        }
        else if (source) {
            await extensionsApi.createInstanceFromSource(projectId, instanceId, source, params);
        }
        else {
            throw new error_1.FirebaseError(`Neither a extension source nor an extension version was supplied for ${extensionName}. Please make sure this is a valid extension and try again.`);
        }
        spinner.stop();
        utils.logLabeledSuccess(extensionsHelper_1.logPrefix, `Successfully installed your instance of ${clc.bold(spec.displayName || spec.name)}! ` +
            `Its Instance ID is ${clc.bold(instanceId)}.`);
        utils.logLabeledBullet(extensionsHelper_1.logPrefix, marked("Go to the Firebase console to view instructions for using your extension, " +
            `which may include some required post-installation tasks: ${utils.consoleUrl(projectId, `/extensions/instances/${instanceId}?tab=usage`)}`));
        logger.info(marked("You can run `firebase ext` to view available Firebase Extensions commands, " +
            "including those to update, reconfigure, or delete your installed extension."));
    }
    catch (err) {
        if (spinner.isSpinning) {
            spinner.fail();
        }
        if (err instanceof error_1.FirebaseError) {
            throw err;
        }
        throw new error_1.FirebaseError(`Error occurred installing extension: ${err.message}`, {
            original: err,
        });
    }
}
exports.default = new command_1.Command("ext:install [extensionName]")
    .description("install an official extension if [extensionName] or [extensionName@version] is provided; " +
    (previews_1.previews.extdev
        ? "install a local extension if [localPathOrUrl] or [url#root] is provided; install a published extension (not authored by Firebase) if [publisherId/extensionId] is provided "
        : "") +
    "or run with `-i` to see all available extensions.")
    .option("--params <paramsFile>", "name of params variables file with .env format.")
    .before(requirePermissions_1.requirePermissions, ["firebaseextensions.instances.create"])
    .before(extensionsHelper_1.ensureExtensionsApiEnabled)
    .before(checkMinRequiredVersion_1.checkMinRequiredVersion, "extMinVersion")
    .action(async (extensionName, options) => {
    const projectId = getProjectId(options, false);
    const paramFilePath = options.params;
    let learnMore = false;
    if (!extensionName) {
        if (options.interactive) {
            learnMore = true;
            extensionName = await extensionsHelper_1.promptForOfficialExtension("Which official extension do you wish to install?\n" +
                "  Select an extension, then press Enter to learn more.");
        }
        else {
            throw new error_1.FirebaseError(`Please provide an extension name, or run ${clc.bold("firebase ext:install -i")} to select from the list of all available official extensions.`);
        }
    }
    const [name, version] = extensionName.split("@");
    let source;
    let extVersion;
    try {
        const registryEntry = await resolveSource_1.resolveRegistryEntry(name);
        const sourceUrl = resolveSource_1.resolveSourceUrl(registryEntry, name, version);
        source = await extensionsApi.getSource(sourceUrl);
        displayExtensionInfo_1.displayExtInfo(extensionName, source.spec, true);
        await extensionsHelper_1.confirmInstallInstance();
        const audienceConsent = await resolveSource_1.promptForAudienceConsent(registryEntry);
        if (!audienceConsent) {
            logger.info("Install cancelled.");
            return;
        }
    }
    catch (err) {
        if (previews_1.previews.extdev) {
            const sourceOrigin = await extensionsHelper_1.getSourceOrigin(extensionName);
            switch (sourceOrigin) {
                case extensionsHelper_1.SourceOrigin.LOCAL || extensionsHelper_1.SourceOrigin.URL: {
                    try {
                        source = await extensionsHelper_1.createSourceFromLocation(projectId, extensionName);
                    }
                    catch (err) {
                        throw new error_1.FirebaseError(`Unable to find published extension '${clc.bold(extensionName)}', ` +
                            `and encountered the following error when trying to create an instance of extension '${clc.bold(extensionName)}':\n ${err.message}`);
                    }
                    displayExtensionInfo_1.displayExtInfo(extensionName, source.spec);
                    await extensionsHelper_1.confirmInstallInstance();
                    break;
                }
                case extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION: {
                    await extensionsApi.getExtension(extensionName);
                    extVersion = await extensionsApi.getExtensionVersion(`${extensionName}@latest`);
                    displayExtensionInfo_1.displayExtInfo(extensionName, extVersion.spec, true);
                    await extensionsHelper_1.confirmInstallInstance();
                    break;
                }
                case extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION_VERSION: {
                    extVersion = await extensionsApi.getExtensionVersion(`${extensionName}`);
                    displayExtensionInfo_1.displayExtInfo(extensionName, extVersion.spec, true);
                    await extensionsHelper_1.confirmInstallInstance();
                    break;
                }
                default: {
                    throw new error_1.FirebaseError(`Could not determine source origin for extension '${extensionName}'. If this is a published extension, ` +
                        "please make sure the publisher and extension exist before trying again. If trying to create an extension, " +
                        "please ensure the path or URL given is valid.");
                }
            }
        }
        else {
            throw new error_1.FirebaseError(`Unable to find published extension '${clc.bold(extensionName)}'. ` +
                `Run ${clc.bold("firebase ext:install -i")} to select from the list of all available published extensions.`, { original: err });
        }
    }
    const spec = (source === null || source === void 0 ? void 0 : source.spec) || (extVersion === null || extVersion === void 0 ? void 0 : extVersion.spec);
    if (!spec) {
        throw new error_1.FirebaseError(`Could not find the extension.yaml for extension '${clc.bold(extensionName)}'. Please make sure this is a valid extension and try again.`);
    }
    try {
        if (learnMore) {
            utils.logLabeledBullet(extensionsHelper_1.logPrefix, `You selected: ${clc.bold(spec.displayName)}.\n` +
                `${spec.description}\n` +
                `View details: https://firebase.google.com/products/extensions/${name}\n`);
            const confirm = await prompt_1.promptOnce({
                type: "confirm",
                default: true,
                message: "Do you wish to install this extension?",
            });
            if (!confirm) {
                return;
            }
        }
        return installExtension({
            paramFilePath,
            projectId,
            extensionName,
            source,
            extVersion,
        });
    }
    catch (err) {
        if (!(err instanceof error_1.FirebaseError)) {
            throw new error_1.FirebaseError(`Error occurred installing the extension: ${err.message}`, {
                original: err,
            });
        }
        throw err;
    }
});
