import {contextBridge} from "electron";
import patchDefine from "./patcher";
import newProcess from "./process";
import * as BdApi from "./api";
import init from "./init";

patchDefine();

let hasInitialized = false;
contextBridge.exposeInMainWorld("process", newProcess);
contextBridge.exposeInMainWorld("BetterDiscordPreload", () => {
    if (hasInitialized) return null;
    hasInitialized = true;
    return BdApi;
});

const M = require("module");
const orig = M.prototype.require;
M.prototype.require = function (id) {
	if (id.toLowerCase().includes("sentry")) {
		console.log(id);
		return null;
	}
	return orig.apply(this, [id]);
};

init();
