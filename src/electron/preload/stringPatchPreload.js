import fs from "fs";
import path from "path";

export default preloadPath => {
	const preload = fs.readFileSync(path.join(preloadPath), "utf8");
	// https://esbuild.github.io/content-types/#direct-eval
	(0, eval)(preload.replace("exports.getGlobalSentry=", "exports.init=()=>{};exports.getGlobalSentry="));
};
