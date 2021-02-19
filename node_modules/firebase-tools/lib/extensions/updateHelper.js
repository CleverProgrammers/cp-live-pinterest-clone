"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFromRegistry = exports.updateToVersionFromRegistry = exports.updateFromPublisherSource = exports.updateToVersionFromPublisherSource = exports.updateFromUrlSource = exports.updateFromLocalSource = exports.update = exports.retryUpdate = exports.displayChanges = exports.warningUpdateToOtherSource = exports.getExistingSourceOrigin = void 0;
const clc = require("cli-color");
const semver = require("semver");
const error_1 = require("../error");
const logger = require("../logger");
const resolveSource = require("./resolveSource");
const extensionsApi = require("./extensionsApi");
const prompt_1 = require("../prompt");
const extensionsHelper_1 = require("./extensionsHelper");
const utils = require("../utils");
const displayExtensionInfo_1 = require("./displayExtensionInfo");
function invalidSourceErrMsgTemplate(instanceId, source) {
    return `Unable to update from the source \`${clc.bold(source)}\`. To update this instance, you can either:\n
  - Run \`${clc.bold("firebase ext:update " + instanceId)}\` to update from the published source.\n
  - Check your directory path or URL, then run \`${clc.bold("firebase ext:update " + instanceId + " <otherSource>")}\` to update from a local directory or URL source.`;
}
async function getExistingSourceOrigin(projectId, instanceId, extensionName, existingSource) {
    const instance = await extensionsApi.getInstance(projectId, instanceId);
    if (instance && instance.config.extensionRef) {
        return extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION;
    }
    let existingSourceOrigin;
    try {
        const registryEntry = await resolveSource.resolveRegistryEntry(extensionName);
        if (resolveSource.isOfficialSource(registryEntry, existingSource)) {
            existingSourceOrigin = extensionsHelper_1.SourceOrigin.OFFICIAL_EXTENSION;
        }
        else {
            existingSourceOrigin = extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION;
        }
    }
    catch (_a) {
        if (extensionsHelper_1.urlRegex.test(existingSource)) {
            existingSourceOrigin = extensionsHelper_1.SourceOrigin.URL;
        }
        else {
            existingSourceOrigin = extensionsHelper_1.SourceOrigin.LOCAL;
        }
    }
    return existingSourceOrigin;
}
exports.getExistingSourceOrigin = getExistingSourceOrigin;
async function showUpdateVersionInfo(instanceId, from, to, source) {
    if (source) {
        source = clc.bold(source);
    }
    else {
        source = "version";
    }
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, `Updating ${clc.bold(instanceId)} from version ${clc.bold(from)} to ${source} (${clc.bold(to)})`);
    if (semver.lt(to, from)) {
        utils.logLabeledBullet(extensionsHelper_1.logPrefix, "The version you are updating to is less than the current version for this extension. This extension may not be backwards compatible.");
        return await displayExtensionInfo_1.getConsent("version", "Do you wish to continue?");
    }
    return;
}
async function warningUpdateToOtherSource(existingSourceOrigin, warning, nextSourceOrigin, additionalMsg) {
    let msg = warning;
    let joinText = "";
    if (existingSourceOrigin === nextSourceOrigin) {
        joinText = "also ";
    }
    msg +=
        `The current source for this instance is a(n) ${existingSourceOrigin}. The new source for this instance will ${joinText}be a(n) ${nextSourceOrigin}.\n\n` +
            `${additionalMsg || ""}`;
    const updateWarning = {
        from: existingSourceOrigin,
        description: msg,
    };
    return await resolveSource.confirmUpdateWarning(updateWarning);
}
exports.warningUpdateToOtherSource = warningUpdateToOtherSource;
async function displayChanges(spec, newSpec, published = false) {
    logger.info("This update contains the following changes (in green and red). " +
        "If at any point you choose not to continue, the extension will not be updated and the changes will be discarded:\n");
    displayExtensionInfo_1.displayUpdateChangesNoInput(spec, newSpec, published);
    await displayExtensionInfo_1.displayUpdateChangesRequiringConfirmation(spec, newSpec);
}
exports.displayChanges = displayChanges;
async function retryUpdate() {
    return prompt_1.promptOnce({
        type: "confirm",
        message: "Are you sure you wish to continue with updating anyways?",
        default: false,
    });
}
exports.retryUpdate = retryUpdate;
async function update(updateOptions) {
    const { projectId, instanceId, source, extRef, params } = updateOptions;
    if (extRef) {
        return await extensionsApi.updateInstanceFromRegistry(projectId, instanceId, extRef, params);
    }
    else if (source) {
        return await extensionsApi.updateInstance(projectId, instanceId, source, params);
    }
    throw new error_1.FirebaseError(`Neither a source nor a version of the extension was supplied for ${instanceId}. Please make sure this is a valid extension and try again.`);
}
exports.update = update;
async function updateFromLocalSource(projectId, instanceId, localSource, existingSpec, existingSource) {
    let source;
    try {
        source = await extensionsHelper_1.createSourceFromLocation(projectId, localSource);
    }
    catch (err) {
        throw new error_1.FirebaseError(invalidSourceErrMsgTemplate(instanceId, localSource));
    }
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, `${clc.bold("You are updating this extension instance to a local source.")}`);
    await showUpdateVersionInfo(instanceId, existingSpec.version, source.spec.version, localSource);
    const warning = "All the instance's extension-specific resources and logic will be overwritten to use the source code and files from the local directory.\n\n";
    const additionalMsg = "After updating from a local source, this instance cannot be updated in the future to use a published source from Firebase's registry of extensions.";
    const existingSourceOrigin = await getExistingSourceOrigin(projectId, instanceId, existingSpec.name, existingSource);
    await module.exports.warningUpdateToOtherSource(existingSourceOrigin, warning, extensionsHelper_1.SourceOrigin.LOCAL, additionalMsg);
    return source.name;
}
exports.updateFromLocalSource = updateFromLocalSource;
async function updateFromUrlSource(projectId, instanceId, urlSource, existingSpec, existingSource) {
    let source;
    try {
        source = await extensionsHelper_1.createSourceFromLocation(projectId, urlSource);
    }
    catch (err) {
        throw new error_1.FirebaseError(invalidSourceErrMsgTemplate(instanceId, urlSource));
    }
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, `${clc.bold("You are updating this extension instance to a URL source.")}`);
    await showUpdateVersionInfo(instanceId, existingSpec.version, source.spec.version, urlSource);
    const warning = "All the instance's extension-specific resources and logic will be overwritten to use the source code and files from the URL.\n\n";
    const additionalMsg = "After updating from a URL source, this instance cannot be updated in the future to use a published source from Firebase's registry of extensions.";
    const existingSourceOrigin = await getExistingSourceOrigin(projectId, instanceId, existingSpec.name, existingSource);
    await module.exports.warningUpdateToOtherSource(existingSourceOrigin, warning, extensionsHelper_1.SourceOrigin.URL, additionalMsg);
    return source.name;
}
exports.updateFromUrlSource = updateFromUrlSource;
async function updateToVersionFromPublisherSource(projectId, instanceId, extVersionRef, existingSpec, existingSource) {
    let source;
    try {
        source = await extensionsApi.getExtensionVersion(extVersionRef);
    }
    catch (err) {
        const refObj = extensionsApi.parseRef(extVersionRef);
        const version = refObj.version;
        const extension = await extensionsApi.getExtension(`${refObj.publisherId}/${refObj.extensionId}`);
        throw new error_1.FirebaseError(`Could not find source '${clc.bold(extVersionRef)}' because (${clc.bold(version)}) is not a published version. To update, use the latest version of this extension (${clc.bold(extension.latestVersion)}).`);
    }
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, `${clc.bold("You are updating this extension instance to a published source.")}`);
    await showUpdateVersionInfo(instanceId, existingSpec.version, source.spec.version, extVersionRef);
    const warning = "All the instance's extension-specific resources and logic will be overwritten to use the source code and files from the published extension.\n\n";
    const existingSourceOrigin = await getExistingSourceOrigin(projectId, instanceId, existingSpec.name, existingSource);
    await module.exports.warningUpdateToOtherSource(existingSourceOrigin, warning, extensionsHelper_1.SourceOrigin.PUBLISHED_EXTENSION);
    return source.name;
}
exports.updateToVersionFromPublisherSource = updateToVersionFromPublisherSource;
async function updateFromPublisherSource(projectId, instanceId, extRef, existingSpec, existingSource) {
    return updateToVersionFromPublisherSource(projectId, instanceId, `${extRef}@latest`, existingSpec, existingSource);
}
exports.updateFromPublisherSource = updateFromPublisherSource;
async function updateToVersionFromRegistry(projectId, instanceId, existingSpec, existingSource, version) {
    if (version !== "latest" && !semver.valid(version)) {
        throw new error_1.FirebaseError(`cannot update to invalid version ${version}`);
    }
    let registryEntry;
    try {
        registryEntry = await resolveSource.resolveRegistryEntry(existingSpec.name);
    }
    catch (err) {
        throw new error_1.FirebaseError(`Cannot find the latest version of this extension. To update this instance to a local source or URL source, run "firebase ext:update ${instanceId} <localSourceOrURL>".`);
    }
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, clc.bold("You are updating this extension instance to an official source."));
    const minVer = resolveSource.getMinRequiredVersion(registryEntry);
    if (minVer) {
        if (version !== "latest" && semver.gt(minVer, version)) {
            throw new error_1.FirebaseError(`The version you are trying to upgrade to (${clc.bold(version)}) is less than the minimum version required (${clc.bold(minVer)}) to use this extension.`);
        }
    }
    const targetVersion = resolveSource.getTargetVersion(registryEntry, version);
    await showUpdateVersionInfo(instanceId, existingSpec.version, targetVersion);
    const warning = "All the instance's extension-specific resources and logic will be overwritten to use the source code and files from the latest released version.\n\n";
    const existingSourceOrigin = await getExistingSourceOrigin(projectId, instanceId, existingSpec.name, existingSource);
    await module.exports.warningUpdateToOtherSource(existingSourceOrigin, warning, extensionsHelper_1.SourceOrigin.OFFICIAL_EXTENSION);
    await resolveSource.promptForUpdateWarnings(registryEntry, existingSpec.version, targetVersion);
    return resolveSource.resolveSourceUrl(registryEntry, existingSpec.name, targetVersion);
}
exports.updateToVersionFromRegistry = updateToVersionFromRegistry;
async function updateFromRegistry(projectId, instanceId, existingSpec, existingSource) {
    return updateToVersionFromRegistry(projectId, instanceId, existingSpec, existingSource, "latest");
}
exports.updateFromRegistry = updateFromRegistry;
