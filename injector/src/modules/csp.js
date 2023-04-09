import electron from "electron";

const fetch =  ["https://raw.githubusercontent.com","https://*.github.com"];
const img = ["https://raw.githubusercontent.com","https://*.github.com"];
const scripts = ["https://cdnjs.cloudflare.com"];
const style = ["https://cdnjs.cloudflare.com"];
const font = ["https://cdnjs.cloudflare.com"];

export default class {
    static remove() {
        electron.session.defaultSession.webRequest.onHeadersReceived(function(details, callback) {
            const headers = Object.keys(details.responseHeaders);
            if (details.responseHeaders["content-security-policy"]) {
				let CSP = details.responseHeaders["content-security-policy"][0];
				CSP = CSP.replace(/(connect-src.+?)(?:;)/, `$1 ${fetch.join(' ')};`);
				CSP = CSP.replace(/(img-src.+?)(?:;)/, `$1 ${img.join(' ')};`);
				CSP = CSP.replace(/(script-src.+?)(?:;)/, `$1 ${scripts.join(' ')};`);
				CSP = CSP.replace(/(style-src.+?)(?:;)/, `$1 ${style.join(' ')};`);
				CSP = CSP.replace(/(font-src.+?)(?:;)/, `$1 ${font.join(' ')};`);
				CSP += " object-src 'none'; base-uri 'none';";
				details.responseHeaders["content-security-policy"] = [CSP];
			}
            callback({cancel: false, responseHeaders: details.responseHeaders});
        });
    }
}