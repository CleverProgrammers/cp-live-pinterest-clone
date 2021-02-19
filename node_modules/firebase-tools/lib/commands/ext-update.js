"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clc = require("cli-color");
const _ = require("lodash");
const marked = require("marked");
const ora = require("ora");
const TerminalRenderer = require("marked-terminal");
const semver = require("semver");
const checkMinRequiredVersion_1 = require("../checkMinRequiredVersion");
const command_1 = require("../command");
const error_1 = require("../error");
const billingMigrationHelper_1 = require("../extensions/billingMigrationHelper");
const checkProjectBilling_1 = require("../extensions/checkProjectBilling");
const extensionsApi = require("../extensions/extensionsApi");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const paramHelper = require("../extensions/paramHelper");
const updateHelper_1 = require("../extensions/updateHelper");
const getProjectId = require("../getProjectId");
const requirePermissions_1 = require("../requirePermissions");
const utils = require("../utils");
const previews_1 = require("../previews");
const displayExtensionInfo_1 = require("../extensions/displayExtensionInfo");
marked.setOptions({
    renderer: new TerminalRenderer(),
});
exports.default = new command_1.Command("ext:update <extensionInstanceId> [updateSource]")
    .description(previews_1.previews.extdev
    ? "update an existing extension instance to the latest version or from a local or URL source"
    : "update an existing extension instance to the latest version")
    .before(requirePermissions_1.requirePermissions, [
    "firebaseextensions.instances.update",
    "firebaseextensions.instances.get",
])
    .before(extensionsHelper_1.ensureExtensionsApiEnabled)
    .before(checkMinRequiredVersion_1.checkMinRequiredVersion, "extMinVersion")
    .action(async (instanceId, updateSource, options) => {
    const spinner = ora.default(`Updating ${clc.bold(instanceId)}. This usually takes 3 to 5 minutes...`);
    try {
        const projectId = getProjectId(options, false);
        let existingInstance;
        try {
            existingInstance = await extensionsApi.getInstance(projectId, instanceId);
        }
        catch (err) {
            if (err.status === 404) {
                throw new error_1.FirebaseError(`Extension instance '${clc.bold(instanceId)}' not found in project '${clc.bold(projectId)}'.`);
            }
            throw err;
        }
        const existingSpec = _.get(existingInstance, "config.source.spec");
        if (existingInstance.config.source.state === "DELETED") {
            throw new error_1.FirebaseError(`Instance '${clc.bold(instanceId)}' cannot be updated anymore because the underlying extension was unpublished from Firebase's registry of extensions. Going forward, you will only be able to re-configure or uninstall this instance.`);
        }
        const existingParams = _.get(existingInstance, "config.params");
        const existingSource = _.get(existingInstance, "config.source.name");
        if (existingInstance.config.extensionRef && !updateSource) {
            updateSource = `${existingInstance.config.extensionRef}@latest`;
        }
        else if (existingInstance.config.extensionRef && semver.valid(updateSource)) {
            updateSource = `${existingInstance.config.extensionRef}@${updateSource}`;
        }
        let newSourceName;
        let published = false;
        const existingSourceOrigin = await updateHelper_1.getExistingSourceOrigin(projectId, instanceId, existingSpec.name, existingSource);
        const newSourceOrigin = await extensionsHelper_1.getSourceOrigin(updateSource);
        let validUpdate = false;
        if (existingSourceOrigin === extensionsHelper_1.SourceOrigin.OFFICIAL_EXTENSION) {
            if ([
                extensionsHelper_1.SourceOrigin.LOCAL,
                extensionsHelper_1.SourceOrigin.URL,
                extensionsHelper_1.SourceOrigin.OFFICIAL_EXTENSION,
                extensionsHelper_1.SourceOrigin.OFFICIAL_EXTENSION_VERSION,
            ].includes(newSourceOrigin)) {
                validUpdate = true;
            }
        }
        else if (existingSourceOrigin === extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION) {
            if ([
                extensionsHelper_1.SourceOrigin.LOCAL,
                extensionsHelper_1.SourceOrigin.URL,
                extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION,
                extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION_VERSION,
            ].includes(newSourceOrigin)) {
                validUpdate = true;
            }
        }
        else if (existingSourceOrigin === extensionsHelper_1.SourceOrigin.LOCAL ||
            existingSourceOrigin === extensionsHelper_1.SourceOrigin.URL) {
            if ([extensionsHelper_1.SourceOrigin.LOCAL, extensionsHelper_1.SourceOrigin.URL].includes(newSourceOrigin)) {
                validUpdate = true;
            }
        }
        if (!validUpdate) {
            throw new error_1.FirebaseError(`Cannot update from a(n) ${existingSourceOrigin} to a(n) ${newSourceOrigin}. Please provide a new source that is a(n) ${existingSourceOrigin} and try again.`);
        }
        const isPublished = [
            extensionsHelper_1.SourceOrigin.OFFICIAL_EXTENSION,
            extensionsHelper_1.SourceOrigin.OFFICIAL_EXTENSION_VERSION,
            extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION,
            extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION_VERSION,
        ].includes(newSourceOrigin);
        displayExtensionInfo_1.displayExtInfo(instanceId, existingSpec, isPublished);
        switch (newSourceOrigin) {
            case extensionsHelper_1.SourceOrigin.LOCAL:
                if (previews_1.previews.extdev) {
                    newSourceName = await updateHelper_1.updateFromLocalSource(projectId, instanceId, updateSource, existingSpec, existingSource);
                    break;
                }
            case extensionsHelper_1.SourceOrigin.URL:
                if (previews_1.previews.extdev) {
                    newSourceName = await updateHelper_1.updateFromUrlSource(projectId, instanceId, updateSource, existingSpec, existingSource);
                    break;
                }
            case extensionsHelper_1.SourceOrigin.OFFICIAL_EXTENSION_VERSION:
                newSourceName = await updateHelper_1.updateToVersionFromRegistry(projectId, instanceId, existingSpec, existingSource, updateSource);
                break;
            case extensionsHelper_1.SourceOrigin.OFFICIAL_EXTENSION:
                newSourceName = await updateHelper_1.updateFromRegistry(projectId, instanceId, existingSpec, existingSource);
                break;
            case extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION_VERSION:
                if (previews_1.previews.extdev) {
                    newSourceName = await updateHelper_1.updateToVersionFromPublisherSource(projectId, instanceId, updateSource, existingSpec, existingSource);
                    published = true;
                    break;
                }
            case extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION:
                if (previews_1.previews.extdev) {
                    newSourceName = await updateHelper_1.updateFromPublisherSource(projectId, instanceId, updateSource, existingSpec, existingSource);
                    published = true;
                    break;
                }
            default:
                throw new error_1.FirebaseError(`Unknown source '${clc.bold(updateSource)}.'`);
        }
        const newSource = await extensionsApi.getSource(newSourceName);
        const newSpec = newSource.spec;
        if (![extensionsHelper_1.SourceOrigin.LOCAL, extensionsHelper_1.SourceOrigin.URL].includes(newSourceOrigin) &&
            existingSpec.version === newSpec.version) {
            utils.logLabeledBullet(extensionsHelper_1.logPrefix, `${clc.bold(instanceId)} is already up to date. Its version is ${clc.bold(existingSpec.version)}.`);
            const retry = await updateHelper_1.retryUpdate();
            if (!retry) {
                utils.logLabeledBullet(extensionsHelper_1.logPrefix, "Update aborted.");
                return;
            }
        }
        await updateHelper_1.displayChanges(existingSpec, newSpec, published);
        if (newSpec.billingRequired) {
            const enabled = await checkProjectBilling_1.isBillingEnabled(projectId);
            if (!enabled) {
                await billingMigrationHelper_1.displayNode10UpdateBillingNotice(existingSpec, newSpec, false);
                await checkProjectBilling_1.enableBilling(projectId, instanceId);
            }
            else {
                await billingMigrationHelper_1.displayNode10UpdateBillingNotice(existingSpec, newSpec, true);
            }
        }
        const newParams = await paramHelper.promptForNewParams(existingSpec, newSpec, existingParams, projectId);
        spinner.start();
        const updateOptions = {
            projectId,
            instanceId,
            source: newSource,
        };
        if (newSourceName.includes("publisher")) {
            const { publisherId, extensionId, version } = extensionsApi.parseExtensionVersionName(newSourceName);
            updateOptions.extRef = `${publisherId}/${extensionId}@${version}`;
        }
        else {
            updateOptions.source = newSource;
        }
        if (!_.isEqual(newParams, existingParams)) {
            updateOptions.params = newParams;
        }
        await updateHelper_1.update(updateOptions);
        spinner.stop();
        utils.logLabeledSuccess(extensionsHelper_1.logPrefix, `successfully updated ${clc.bold(instanceId)}.`);
        utils.logLabeledBullet(extensionsHelper_1.logPrefix, marked(`You can view your updated instance in the Firebase console: ${utils.consoleUrl(projectId, `/extensions/instances/${instanceId}?tab=usage`)}`));
    }
    catch (err) {
        if (spinner.isSpinning) {
            spinner.fail();
        }
        if (!(err instanceof error_1.FirebaseError)) {
            throw new error_1.FirebaseError(`Error occurred while updating the instance: ${err.message}`, {
                original: err,
            });
        }
        throw err;
    }
});
