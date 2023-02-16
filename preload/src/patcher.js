import {webFrame} from "electron";

/* global window:false */

export default function () {
    const patcher = function () {
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
                Object.entries(arg[1]).forEach(([id, module]) => {
                    if (byStrings(["BrowserClient", "init", "sentry"], module)) {
                        arg[1][id] = () => {};
                        instance.push = oldPush;
                    }
                });
                oldPush(arg);
            }
        }
        const chunkName = "webpackChunkdiscord_app";
        const predefine = function (target, prop, effect) {
            const value = target[prop];
            Object.defineProperty(target, prop, {
                get() {return value;},
                set(newValue) {
                    Object.defineProperty(target, prop, {
                        value: newValue,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });

                    try {
                        effect(newValue);
                    }
                    catch (error) {
                        // eslint-disable-next-line no-console
                        console.error(error);
                    }

                    // eslint-disable-next-line no-setter-return
                    return newValue;
                },
                configurable: true
            });
        };
        
        if (!Reflect.has(window, chunkName)) {
            predefine(window, chunkName, instance => {
                predefine(instance, "push", () => {
                    instance.push([[Symbol()], {}, require => {
                        require.d = (target, exports) => {
                            for (const key in exports) {
                                if (!Reflect.has(exports, key) || target[key]) continue;
        
                                Object.defineProperty(target, key, {
                                    get: () => exports[key](),
                                    set: v => {exports[key] = () => v;},
                                    enumerable: true,
                                    configurable: true
                                });
                            }
                        };
                    }]);
        
                    instance.pop();
                    removeSentry(instance);
                });
            });
        }
    };
    
    webFrame.top.executeJavaScript("(" + patcher + ")()");
}
