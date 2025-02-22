import { webFrame } from "electron";

/* global window:false */

export default function () {
	const patcher = () => {
		const filters = [
			(module) => byStrings(["BrowserClient", "init", "sentry"], module),
			(module) => byStrings(["usesClientMods", "initSentry"], module),
			(module) =>
				byStrings(["TRACK", "FINGERPRINT", "handleFingerprint"], module),
		];

		function byStrings(strings, module) {
			const moduleString = module.toString();
			for (const s of strings) {
				if (!moduleString.includes(s)) return false;
			}
			return true;
		}

		function removeSentry(instance) {
			const oldPush = instance.push;
			instance.push = (arg) => {
				const modules = Object.entries(arg[1]);
				for (const [id, module] of modules) {
					if (filters.length === 0) {
						console.log("done");
						instance.push = oldPush;
						break;
					}
					for (const filter of filters) {
						if (filter(module)) {
							arg[1][id] = (e, t, n) => {
								n.r(t);
								n.d(t, {
									usesClientMods: () => () => {},
									initSentry: () => () => {},
								});
							};
							filters.splice(filters.indexOf(filter), 1);
							break;
						}
					}
				}

				return oldPush.call(instance, arg);
			};
		}
		const chunkName = "webpackChunkdiscord_app";
		const predefine = (target, prop, effect) => {
			const value = target[prop];
			Object.defineProperty(target, prop, {
				get() {
					return value;
				},
				set(newValue) {
					Object.defineProperty(target, prop, {
						value: newValue,
						configurable: true,
						enumerable: true,
						writable: true,
					});

					try {
						effect(newValue);
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error(error);
					}

					// eslint-disable-next-line no-setter-return
					return newValue;
				},
				configurable: true,
			});
		};

		if (!Reflect.has(window, chunkName)) {
			predefine(window, chunkName, (instance) => {
				instance.push([
					[Symbol()],
					{},
					(require) => {
						require.d = (target, exports) => {
							for (const key in exports) {
								if (!Reflect.has(exports, key)) continue;

								Object.defineProperty(target, key, {
									get: () => exports[key](),
									set: (v) => {
										exports[key] = () => v;
									},
									enumerable: true,
									configurable: true,
								});
							}
						};
					},
				]);
				removeSentry(instance);
			});
		}
	};

	webFrame.top.executeJavaScript("(" + patcher + ")()");
}
