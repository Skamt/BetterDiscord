// https://github.com/Vendicated/WebpackGrabber/blob/bfefd7b907dc9c95c827279a048e73562e9bb3bc/WebpackGrabber.user.js#L15
function getCache(webpackRequire) {
	let cache = null;
	const sym = Symbol("wpgrabber.extract");

	Object.defineProperty(Object.prototype, sym, {
		get() {
			cache = this;
			return {
				exports: {}
			};
		},
		set() {},
		configurable: true
	});

	webpackRequire(sym);
	delete Object.prototype[sym];
	return cache;
}

let patched = false;

function filter(exports) {
	return exports?.getGlobalSentry && exports?.init;
}

function patch(cache) {
	if (patched) return;
	const keys = Object.keys(cache);
	for (var i = keys.length - 1; i >= 0; i--) {
		const key = keys[i];
		const { exports } = cache[key] || {};
		if (!exports) continue;
		if (!filter(exports)) continue;
		exports.init = () => {
			console.log(9999999999);
		};
		patched = true;
		break;
	}	
}

Object.defineProperty(Function.prototype, "d", {
	set(v) {
		delete Function.prototype.d;
		this.d = (...args) => {
			if(patched) this.d = v;
			try {
				const cache = getCache(this);
				if (cache) patch(cache);
			} finally  {
				v.apply(this, args);
			}
		};
	},
	configurable: true
});
