import fs from "fs";
import path from "path";

export default preloadPath => {
	const preload = fs.readFileSync(path.join(preloadPath), "utf8");
	eval(preload.replace("exports.getGlobalSentry=", "exports.init=()=>{};exports.getGlobalSentry="));
};
