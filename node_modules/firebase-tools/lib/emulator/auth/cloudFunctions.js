"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthCloudFunction = void 0;
const apiv2_1 = require("../../apiv2");
const types_1 = require("../types");
const emulatorLogger_1 = require("../emulatorLogger");
const registry_1 = require("../registry");
class AuthCloudFunction {
    constructor(projectId) {
        this.projectId = projectId;
        this.logger = emulatorLogger_1.EmulatorLogger.forEmulator(types_1.Emulators.AUTH);
        this.multicastOrigin = "";
        this.multicastPath = "";
        this.enabled = false;
        const functionsEmulator = registry_1.EmulatorRegistry.get(types_1.Emulators.FUNCTIONS);
        if (functionsEmulator) {
            this.enabled = true;
            this.functionsEmulatorInfo = functionsEmulator.getInfo();
            this.multicastOrigin = `http://${registry_1.EmulatorRegistry.getInfoHostString(this.functionsEmulatorInfo)}`;
            this.multicastPath = `/functions/projects/${projectId}/trigger_multicast`;
        }
    }
    async dispatch(action, user) {
        if (!this.enabled)
            return;
        const userInfoPayload = this.createUserInfoPayload(user);
        const multicastEventBody = this.createEventRequestBody(action, userInfoPayload);
        const c = new apiv2_1.Client({ urlPrefix: this.multicastOrigin, auth: false });
        let res;
        let err;
        try {
            res = await c.post(this.multicastPath, multicastEventBody);
        }
        catch (e) {
            err = e;
        }
        if (err || (res === null || res === void 0 ? void 0 : res.status) != 200) {
            this.logger.logLabeled("WARN", "functions", `Firebase Authentication function was not triggered due to emulation error. Please file a bug.`);
        }
    }
    createEventRequestBody(action, userInfoPayload) {
        return {
            eventType: `providers/firebase.auth/eventTypes/user.${action}`,
            data: userInfoPayload,
        };
    }
    createUserInfoPayload(user) {
        return {
            uid: user.localId,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            photoURL: user.photoUrl,
            phoneNumber: user.phoneNumber,
            disabled: user.disabled,
            metadata: {
                creationTime: user.createdAt,
                lastSignInTime: user.lastLoginAt,
            },
            customClaims: JSON.parse(user.customAttributes || "{}"),
            providerData: user.providerUserInfo,
            tenantId: user.tenantId,
        };
    }
}
exports.AuthCloudFunction = AuthCloudFunction;
