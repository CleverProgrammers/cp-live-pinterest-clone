"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const google_auth_library_1 = require("google-auth-library");
const clc = require("cli-color");
const api = require("./api");
const apiv2 = require("./apiv2");
const configstore_1 = require("./configstore");
const error_1 = require("./error");
const logger = require("./logger");
const utils = require("./utils");
const scopes = require("./scopes");
const AUTH_ERROR_MESSAGE = `Command requires authentication, please run ${clc.bold("firebase login")}`;
let authClient;
function getAuthClient(config) {
    if (authClient) {
        return authClient;
    }
    authClient = new google_auth_library_1.GoogleAuth(config);
    return authClient;
}
async function autoAuth(options, authScopes) {
    const client = getAuthClient({ scopes: authScopes, projectId: options.project });
    const token = await client.getAccessToken();
    api.setAccessToken(token);
    token !== null ? apiv2.setAccessToken(token) : false;
}
async function requireAuth(options) {
    api.setScopes([scopes.CLOUD_PLATFORM, scopes.FIREBASE_PLATFORM]);
    options.authScopes = api.getScopes();
    const tokens = configstore_1.configstore.get("tokens");
    const user = configstore_1.configstore.get("user");
    let tokenOpt = utils.getInheritedOption(options, "token");
    if (tokenOpt) {
        logger.debug("> authorizing via --token option");
    }
    else if (process.env.FIREBASE_TOKEN) {
        logger.debug("> authorizing via FIREBASE_TOKEN environment variable");
    }
    else if (user) {
        logger.debug("> authorizing via signed-in user");
    }
    else {
        try {
            return await autoAuth(options, options.authScopes);
        }
        catch (e) {
            throw new error_1.FirebaseError(`Failed to authenticate, have you run ${clc.bold("firebase login")}?`, { original: e });
        }
    }
    tokenOpt = tokenOpt || process.env.FIREBASE_TOKEN;
    if (tokenOpt) {
        api.setRefreshToken(tokenOpt);
        apiv2.setRefreshToken(tokenOpt);
        return;
    }
    if (!user || !tokens) {
        throw new error_1.FirebaseError(AUTH_ERROR_MESSAGE);
    }
    options.user = user;
    options.tokens = tokens;
    api.setRefreshToken(tokens.refresh_token);
    apiv2.setRefreshToken(tokens.refresh_token);
}
exports.requireAuth = requireAuth;
