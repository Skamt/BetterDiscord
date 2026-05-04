import {contextBridge, ipcRenderer} from "electron";
import newProcess from "./process";
import * as BdApi from "./api";
import init from "./init";
import DiscordNativePatch from "./discordnativepatch";
import * as IPCEvents from "@common/constants/ipcevents";

DiscordNativePatch.init();

let hasInitialized = 0;
contextBridge.exposeInMainWorld("process", newProcess);
contextBridge.exposeInMainWorld("BetterDiscordPreload", () => {
    if (hasInitialized >= 2) return null;
    hasInitialized++;
    return BdApi;
});


const M = require("module");
const orig = M.prototype.require;
M.prototype.require = function (id) {
	if (id.includes("/common/crashReporterSetup")) {
		console.log(id);
		return null;
	}
	return orig.apply(this, [id]);
};

let hasRanRenderer = false;
contextBridge.exposeInMainWorld("BetterDiscordRunRenderer", () => {
    if (hasRanRenderer) return null;
    hasRanRenderer = true;

    ipcRenderer.invoke(IPCEvents.RUN_RENDERER);
});


init();
