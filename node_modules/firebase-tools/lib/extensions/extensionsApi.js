"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExtensionVersionName = exports.parseRef = exports.getExtension = exports.unpublishExtension = exports.publishExtensionVersion = exports.registerPublisherProfile = exports.listExtensionVersions = exports.listExtensions = exports.getExtensionVersion = exports.getSource = exports.createSource = exports.updateInstanceFromRegistry = exports.updateInstance = exports.configureInstance = exports.listInstances = exports.getInstance = exports.deleteInstance = exports.createInstanceFromExtensionVersion = exports.createInstanceFromSource = exports.createInstance = exports.ParamType = void 0;
const semver = require("semver");
const yaml = require("js-yaml");
const _ = require("lodash");
const clc = require("cli-color");
const api = require("../api");
const logger = require("../logger");
const operationPoller = require("../operation-poller");
const error_1 = require("../error");
const VERSION = "v1beta";
const PAGE_SIZE_MAX = 100;
const refRegex = new RegExp(/^([^/@\n]+)\/{1}([^/@\n]+)(@{1}([a-z0-9.-]+)|)$/);
var ParamType;
(function (ParamType) {
    ParamType["STRING"] = "STRING";
    ParamType["SELECT"] = "SELECT";
    ParamType["MULTISELECT"] = "MULTISELECT";
})(ParamType = exports.ParamType || (exports.ParamType = {}));
async function createInstance(projectId, instanceId, config) {
    const createRes = await api.request("POST", `/${VERSION}/projects/${projectId}/instances/`, {
        auth: true,
        origin: api.extensionsOrigin,
        data: {
            name: `projects/${projectId}/instances/${instanceId}`,
            config: config,
        },
    });
    const pollRes = await operationPoller.pollOperation({
        apiOrigin: api.extensionsOrigin,
        apiVersion: VERSION,
        operationResourceName: createRes.body.name,
        masterTimeout: 600000,
    });
    return pollRes;
}
exports.createInstance = createInstance;
async function createInstanceFromSource(projectId, instanceId, extensionSource, params) {
    const config = {
        source: { name: extensionSource.name },
        params,
    };
    return createInstance(projectId, instanceId, config);
}
exports.createInstanceFromSource = createInstanceFromSource;
async function createInstanceFromExtensionVersion(projectId, instanceId, extensionVersion, params) {
    const { publisherId, extensionId, version } = parseRef(extensionVersion.ref);
    const config = {
        extensionRef: `${publisherId}/${extensionId}`,
        extensionVersion: version || "",
        params,
    };
    return createInstance(projectId, instanceId, config);
}
exports.createInstanceFromExtensionVersion = createInstanceFromExtensionVersion;
async function deleteInstance(projectId, instanceId) {
    const deleteRes = await api.request("DELETE", `/${VERSION}/projects/${projectId}/instances/${instanceId}`, {
        auth: true,
        origin: api.extensionsOrigin,
    });
    const pollRes = await operationPoller.pollOperation({
        apiOrigin: api.extensionsOrigin,
        apiVersion: VERSION,
        operationResourceName: deleteRes.body.name,
        masterTimeout: 600000,
    });
    return pollRes;
}
exports.deleteInstance = deleteInstance;
async function getInstance(projectId, instanceId, options = {}) {
    const res = await api.request("GET", `/${VERSION}/projects/${projectId}/instances/${instanceId}`, _.assign({
        auth: true,
        origin: api.extensionsOrigin,
    }, options));
    return res.body;
}
exports.getInstance = getInstance;
async function listInstances(projectId) {
    const instances = [];
    const getNextPage = async (pageToken) => {
        const res = await api.request("GET", `/${VERSION}/projects/${projectId}/instances`, {
            auth: true,
            origin: api.extensionsOrigin,
            query: {
                pageSize: PAGE_SIZE_MAX,
                pageToken,
            },
        });
        if (Array.isArray(res.body.instances)) {
            instances.push(...res.body.instances);
        }
        if (res.body.nextPageToken) {
            await getNextPage(res.body.nextPageToken);
        }
    };
    await getNextPage();
    return instances;
}
exports.listInstances = listInstances;
async function configureInstance(projectId, instanceId, params) {
    const res = await patchInstance(projectId, instanceId, "config.params", {
        config: {
            params,
        },
    });
    return res;
}
exports.configureInstance = configureInstance;
async function updateInstance(projectId, instanceId, extensionSource, params) {
    const body = {
        config: {
            source: { name: extensionSource.name },
        },
    };
    let updateMask = "config.source.name";
    if (params) {
        body.params = params;
        updateMask += ",config.params";
    }
    return await patchInstance(projectId, instanceId, updateMask, body);
}
exports.updateInstance = updateInstance;
async function updateInstanceFromRegistry(projectId, instanceId, extRef, params) {
    const { publisherId, extensionId, version } = parseRef(extRef);
    const body = {
        config: {
            extensionRef: `${publisherId}/${extensionId}`,
            extensionVersion: version,
        },
    };
    let updateMask = "config.extension_ref,config.extension_version";
    if (params) {
        body.params = params;
        updateMask += ",config.params";
    }
    return await patchInstance(projectId, instanceId, updateMask, body);
}
exports.updateInstanceFromRegistry = updateInstanceFromRegistry;
async function patchInstance(projectId, instanceId, updateMask, data) {
    const updateRes = await api.request("PATCH", `/${VERSION}/projects/${projectId}/instances/${instanceId}`, {
        auth: true,
        origin: api.extensionsOrigin,
        query: {
            updateMask,
        },
        data,
    });
    const pollRes = await operationPoller.pollOperation({
        apiOrigin: api.extensionsOrigin,
        apiVersion: VERSION,
        operationResourceName: updateRes.body.name,
        masterTimeout: 600000,
    });
    return pollRes;
}
function populateResourceProperties(source) {
    const spec = source.spec;
    if (spec) {
        spec.resources.forEach((r) => {
            try {
                if (r.propertiesYaml) {
                    r.properties = yaml.safeLoad(r.propertiesYaml);
                }
            }
            catch (err) {
                logger.debug(`[ext] failed to parse resource properties yaml: ${err}`);
            }
        });
    }
}
async function createSource(projectId, packageUri, extensionRoot) {
    const createRes = await api.request("POST", `/${VERSION}/projects/${projectId}/sources/`, {
        auth: true,
        origin: api.extensionsOrigin,
        data: {
            packageUri,
            extensionRoot,
        },
    });
    const pollRes = await operationPoller.pollOperation({
        apiOrigin: api.extensionsOrigin,
        apiVersion: VERSION,
        operationResourceName: createRes.body.name,
        masterTimeout: 600000,
    });
    populateResourceProperties(pollRes);
    return pollRes;
}
exports.createSource = createSource;
function getSource(sourceName) {
    return api
        .request("GET", `/${VERSION}/${sourceName}`, {
        auth: true,
        origin: api.extensionsOrigin,
    })
        .then((res) => {
        populateResourceProperties(res.body);
        return res.body;
    });
}
exports.getSource = getSource;
async function getExtensionVersion(ref) {
    const { publisherId, extensionId, version } = parseRef(ref);
    if (!version) {
        throw new error_1.FirebaseError(`ExtensionVersion ref "${ref}" must supply a version.`);
    }
    try {
        const res = await api.request("GET", `/${VERSION}/publishers/${publisherId}/extensions/${extensionId}/versions/${version}`, {
            auth: true,
            origin: api.extensionsOrigin,
        });
        return res.body;
    }
    catch (err) {
        if (err.status === 404) {
            throw new error_1.FirebaseError(`The extension reference '${clc.bold(ref)}' doesn't exist. This could happen for two reasons:\n` +
                `  -The publisher ID '${clc.bold(publisherId)}' doesn't exist or could be misspelled\n` +
                `  -The name of the extension version '${clc.bold(`${extensionId}@${version}`)}' doesn't exist or could be misspelled\n` +
                `Please correct the extension reference and try again.`);
        }
        else if (err instanceof error_1.FirebaseError) {
            throw err;
        }
        throw new error_1.FirebaseError(`Failed to query the extension version '${clc.bold(ref)}': ${err}`);
    }
}
exports.getExtensionVersion = getExtensionVersion;
async function listExtensions(publisherId) {
    const extensions = [];
    const getNextPage = async (pageToken) => {
        const res = await api.request("GET", `/${VERSION}/publishers/${publisherId}/extensions`, {
            auth: true,
            origin: api.extensionsOrigin,
            showUnpublished: false,
            query: {
                pageSize: PAGE_SIZE_MAX,
                pageToken,
            },
        });
        if (Array.isArray(res.body.extensions)) {
            extensions.push(...res.body.extensions);
        }
        if (res.body.nextPageToken) {
            await getNextPage(res.body.nextPageToken);
        }
    };
    await getNextPage();
    return extensions;
}
exports.listExtensions = listExtensions;
async function listExtensionVersions(ref) {
    const { publisherId, extensionId } = parseRef(ref);
    const extensionVersions = [];
    const getNextPage = async (pageToken) => {
        const res = await api.request("GET", `/${VERSION}/publishers/${publisherId}/extensions/${extensionId}/versions`, {
            auth: true,
            origin: api.extensionsOrigin,
            query: {
                pageSize: PAGE_SIZE_MAX,
                pageToken,
            },
        });
        if (Array.isArray(res.body.extensionVersions)) {
            extensionVersions.push(...res.body.extensionVersions);
        }
        if (res.body.nextPageToken) {
            await getNextPage(res.body.nextPageToken);
        }
    };
    await getNextPage();
    return extensionVersions;
}
exports.listExtensionVersions = listExtensionVersions;
async function registerPublisherProfile(projectId, publisherId) {
    const res = await api.request("POST", `/${VERSION}/projects/${projectId}/publisherProfile:register`, {
        auth: true,
        origin: api.extensionsOrigin,
        data: { publisherId },
    });
    return res.body;
}
exports.registerPublisherProfile = registerPublisherProfile;
async function publishExtensionVersion(ref, packageUri, extensionRoot) {
    const { publisherId, extensionId, version } = parseRef(ref);
    if (!version) {
        throw new error_1.FirebaseError(`ExtensionVersion ref "${ref}" must supply a version.`);
    }
    const publishRes = await api.request("POST", `/${VERSION}/publishers/${publisherId}/extensions/${extensionId}/versions:publish`, {
        auth: true,
        origin: api.extensionsOrigin,
        data: {
            versionId: version,
            packageUri,
            extensionRoot: extensionRoot || "/",
        },
    });
    const pollRes = await operationPoller.pollOperation({
        apiOrigin: api.extensionsOrigin,
        apiVersion: VERSION,
        operationResourceName: publishRes.body.name,
        masterTimeout: 600000,
    });
    return pollRes;
}
exports.publishExtensionVersion = publishExtensionVersion;
async function unpublishExtension(ref) {
    const { publisherId, extensionId, version } = parseRef(ref);
    if (version) {
        throw new error_1.FirebaseError(`Extension reference "${ref}" must not contain a version.`);
    }
    const url = `/${VERSION}/publishers/${publisherId}/extensions/${extensionId}:unpublish`;
    try {
        await api.request("POST", url, {
            auth: true,
            origin: api.extensionsOrigin,
        });
    }
    catch (err) {
        if (err.status === 403) {
            throw new error_1.FirebaseError(`You are not the owner of extension '${clc.bold(ref)}' and don’t have the correct permissions to unpublish this extension.`);
        }
        else if (err instanceof error_1.FirebaseError) {
            throw err;
        }
        throw new error_1.FirebaseError(`Error occurred unpublishing extension '${ref}': ${err}`);
    }
}
exports.unpublishExtension = unpublishExtension;
async function getExtension(ref) {
    const { publisherId, extensionId } = parseRef(ref);
    try {
        const res = await api.request("GET", `/${VERSION}/publishers/${publisherId}/extensions/${extensionId}`, {
            auth: true,
            origin: api.extensionsOrigin,
        });
        return res.body;
    }
    catch (err) {
        if (err.status === 404) {
            throw new error_1.FirebaseError(`The extension reference '${clc.bold(ref)}' doesn't exist. This could happen for two reasons:\n` +
                `  -The publisher ID '${clc.bold(publisherId)}' doesn't exist or could be misspelled\n` +
                `  -The name of the extension '${clc.bold(extensionId)}' doesn't exist or could be misspelled\n` +
                `Please correct the extension reference and try again.`);
        }
        else if (err instanceof error_1.FirebaseError) {
            throw err;
        }
        throw new error_1.FirebaseError(`Failed to query the extension '${clc.bold(ref)}': ${err}`);
    }
}
exports.getExtension = getExtension;
function parseRef(ref) {
    const parts = refRegex.exec(ref);
    if (parts && (parts.length == 5 || parts.length == 7)) {
        const publisherId = parts[1];
        const extensionId = parts[2];
        const version = parts[4];
        if (version && !semver.valid(version) && version !== "latest") {
            throw new error_1.FirebaseError(`Extension reference ${ref} contains an invalid version ${version}.`);
        }
        return { publisherId, extensionId, version };
    }
    throw new error_1.FirebaseError("Extension reference must be in format '{publisher}/{extension}(@{version})'.");
}
exports.parseRef = parseRef;
function parseExtensionVersionName(extensionVersionName) {
    const parts = extensionVersionName.split("/");
    if (parts.length !== 6 ||
        parts[0] !== "publishers" ||
        parts[2] !== "extensions" ||
        parts[4] !== "versions") {
        throw new error_1.FirebaseError("Extension version name must be in the format `publishers/<publisherID>/extensions/<extensionID>/versions/<versionID>`.");
    }
    const publisherId = parts[1];
    const extensionId = parts[3];
    const version = parts[5];
    return { publisherId, extensionId, version };
}
exports.parseExtensionVersionName = parseExtensionVersionName;
