import fs from "fs";
import path from "path";

export default preloadPath => {
	try {
		const preload = fs.readFileSync(path.join(preloadPath), "utf8");
		const preloadCode = preload.replace("exports.getGlobalSentry=", "exports.init=()=>{};exports.getGlobalSentry=");
		new Function("exports", "require", "module", "__filename", "__dirname", "process", "global", "Buffer", preloadCode)
		(exports, require, module, __filename, __dirname, process, global, Buffer);
	} catch (e) {
		console.error(e);
		require(preloadPath);
	}
};
