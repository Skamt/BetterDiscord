import require from "./polyfill";
import { getByKeys } from "@webpack";
// import { } from "electron";

const { ipcRenderer  } = require("electron");
(async () => {
	let react = null;
	while (!react) {
		react = getByKeys(["createElement", "cloneElement"]);
		await new Promise(s => setTimeout(s, 250));
	}
	ipcRenderer.send("RENDERER_READY");
})();
