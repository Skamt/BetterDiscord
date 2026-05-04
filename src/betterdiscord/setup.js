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
	setTimeout(()=>ipcRenderer.send("RENDERER_READY"), 15*1000);
	// requestIdleCallback(()=>ipcRenderer.send("RENDERER_READY"), {timeout:15*1000});

})();
