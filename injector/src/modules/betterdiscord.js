import fs from "fs";
import path from "path";
import electron from "electron";

import ReactDevTools from "./reactdevtools";
import * as IPCEvents from "common/constants/ipcevents";

// Build info file only exists for non-linux (for current injection)
const appPath = electron.app.getAppPath();
const buildInfoFile = path.resolve(appPath, "..", "build_info.json");

// Locate data path to find transparency settings
let dataPath = "";
if (process.platform === "win32" || process.platform === "darwin") dataPath = path.join(electron.app.getPath("userData"), "..");
else dataPath = process.env.XDG_CONFIG_HOME ? process.env.XDG_CONFIG_HOME : path.join(process.env.HOME, ".config"); // This will help with snap packages eventually
dataPath = `${path.join(dataPath, "BetterDiscord")}/`;

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export  default class BetterDiscord {
	static getWindowPrefs() {
		if (!fs.existsSync(buildInfoFile)) return {};
		const buildInfo = __non_webpack_require__(buildInfoFile);
		const prefsFile = path.resolve(dataPath, "data", buildInfo.releaseChannel, "windowprefs.json");
		if (!fs.existsSync(prefsFile)) return {};
		return __non_webpack_require__(prefsFile);
	}

	static getSetting(category, key) {
		if (BetterDiscord._settings) return BetterDiscord._settings[category]?.[key];

		try {
			const buildInfo = __non_webpack_require__(buildInfoFile);
			const settingsFile = path.resolve(dataPath, "data", buildInfo.releaseChannel, "settings.json");
			BetterDiscord._settings = __non_webpack_require__(settingsFile) ?? {};
			return BetterDiscord._settings[category]?.[key];
		} catch (_) {
			BetterDiscord._settings = {};
			return BetterDiscord._settings[category]?.[key];
		}
	}

	static ensureDirectories() {
		if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
		if (!fs.existsSync(path.join(dataPath, "plugins"))) fs.mkdirSync(path.join(dataPath, "plugins"));
		if (!fs.existsSync(path.join(dataPath, "themes"))) fs.mkdirSync(path.join(dataPath, "themes"));
	}

	static async injectRenderer(browserWindow) {
		const location = path.join(__dirname, "renderer.js");
		if (!fs.existsSync(location)) return; // TODO: cut a fatal log
		const content = fs.readFileSync(location).toString();
		const success = await browserWindow.webContents.executeJavaScript(`
            (() => {
                try {
                    ${content}
                    return true;
                } catch(error) {
                    console.error(error);
                    return false;
                }
            })();
            //# sourceURL=betterdiscord/renderer.js
        `);

		if (!success) return; // TODO: cut a fatal log
	}

	static setup(browserWindow) {
		// Setup some useful vars to avoid blocking IPC calls
		try {
			process.env.DISCORD_RELEASE_CHANNEL = __non_webpack_require__(buildInfoFile).releaseChannel;
		} catch (e) {
			process.env.DISCORD_RELEASE_CHANNEL = "stable";
		}
		process.env.DISCORD_PRELOAD = browserWindow.__originalPreload;
		process.env.DISCORD_APP_PATH = appPath;
		process.env.DISCORD_USER_DATA = electron.app.getPath("userData");
		process.env.BETTERDISCORD_DATA_PATH = dataPath;

		// When DOM is available, pass the renderer over the wall
		browserWindow.webContents.on("dom-ready", () => {
			BetterDiscord.injectRenderer(browserWindow);
		});

		// This is used to alert renderer code to onSwitch events
		browserWindow.webContents.on("did-navigate-in-page", () => {
			browserWindow.webContents.send(IPCEvents.NAVIGATE);
		});

		browserWindow.webContents.on("render-process-gone", (e, info) => {
			try {
				electron.dialog.showMessageBox({
					title: "Discord Crashed",
					type: "warning",
					message: "Something crashed your Discord Client",
					detail: JSON.stringify(info, null, 4)
				});
			} catch {}
		});
	}

	static disableMediaKeys() {
		if (!BetterDiscord.getSetting("general", "mediaKeys")) return;
		const originalDisable = electron.app.commandLine.getSwitchValue("disable-features") || "";
		electron.app.commandLine.appendSwitch("disable-features", `${originalDisable ? "," : ""}HardwareMediaKeyHandling,MediaSessionService`);
	}
}

if (BetterDiscord.getSetting("developer", "reactDevTools")) {
	electron.app.whenReady().then(async () => {
		await ReactDevTools.install(dataPath);
	});
}
