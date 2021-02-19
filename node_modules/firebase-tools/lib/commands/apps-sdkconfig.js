"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ora = require("ora");
const fs = require("fs-extra");
const command_1 = require("../command");
const apps_1 = require("../management/apps");
const getProjectId = require("../getProjectId");
const projects_1 = require("../management/projects");
const error_1 = require("../error");
const requireAuth_1 = require("../requireAuth");
const logger = require("../logger");
const prompt_1 = require("../prompt");
async function selectAppInteractively(apps, appPlatform) {
    if (apps.length === 0) {
        throw new error_1.FirebaseError(`There are no ${appPlatform === apps_1.AppPlatform.ANY ? "" : appPlatform + " "}apps ` +
            "associated with this Firebase project");
    }
    const choices = apps.map((app) => {
        return {
            name: `${app.displayName || app.bundleId || app.packageName}` +
                ` - ${app.appId} (${app.platform})`,
            value: app,
        };
    });
    return await prompt_1.promptOnce({
        type: "list",
        name: "id",
        message: `Select the ${appPlatform === apps_1.AppPlatform.ANY ? "" : appPlatform + " "}` +
            "app to get the configuration data:",
        choices,
    });
}
module.exports = new command_1.Command("apps:sdkconfig [platform] [appId]")
    .description("print the Google Services config of a Firebase app. " +
    "[platform] can be IOS, ANDROID or WEB (case insensitive)")
    .option("-o, --out [file]", "(optional) write config output to a file")
    .before(requireAuth_1.requireAuth)
    .action(async (platform = "", appId = "", options) => {
    let appPlatform = apps_1.getAppPlatform(platform);
    if (!appId) {
        let projectId = getProjectId(options);
        if (options.nonInteractive && !projectId) {
            throw new error_1.FirebaseError("Must supply app and project ids in non-interactive mode.");
        }
        else if (!projectId) {
            const result = await projects_1.getOrPromptProject(options);
            projectId = result.projectId;
        }
        const apps = await apps_1.listFirebaseApps(projectId, appPlatform);
        if (apps.length === 1) {
            appId = apps[0].appId;
            appPlatform = apps[0].platform;
        }
        else if (options.nonInteractive) {
            throw new error_1.FirebaseError(`Project ${projectId} has multiple apps, must specify an app id.`);
        }
        else {
            const appMetadata = await selectAppInteractively(apps, appPlatform);
            appId = appMetadata.appId;
            appPlatform = appMetadata.platform;
        }
    }
    let configData;
    const spinner = ora(`Downloading configuration data of your Firebase ${appPlatform} app`).start();
    try {
        configData = await apps_1.getAppConfig(appId, appPlatform);
    }
    catch (err) {
        spinner.fail();
        throw err;
    }
    spinner.succeed();
    const fileInfo = apps_1.getAppConfigFile(configData, appPlatform);
    if (appPlatform == apps_1.AppPlatform.WEB) {
        fileInfo.sdkConfig = configData;
    }
    if (options.out === undefined) {
        logger.info(fileInfo.fileContents);
        return fileInfo;
    }
    const shouldUseDefaultFilename = options.out === true || options.out === "";
    const filename = shouldUseDefaultFilename ? configData.fileName : options.out;
    if (fs.existsSync(filename)) {
        if (options.nonInteractive) {
            throw new error_1.FirebaseError(`${filename} already exists`);
        }
        const overwrite = await prompt_1.promptOnce({
            type: "confirm",
            default: false,
            message: `${filename} already exists. Do you want to overwrite?`,
        });
        if (!overwrite) {
            return configData;
        }
    }
    fs.writeFileSync(filename, fileInfo.fileContents);
    logger.info(`App configuration is written in ${filename}`);
    return configData;
});
