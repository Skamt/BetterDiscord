export default {
	version: process.env.__VERSION__,
	release: { assets: [] },

	// Get from main process
	path: "",
	appPath: process.env.DISCORD_APP_PATH,
	userData: process.env.DISCORD_USER_DATA,
	dataPath: process.env.BETTERDISCORD_DATA_PATH
};
