import { CookieJar } from "tough-cookie";

const parseCookie = (rawCookie, domain) => {
    const cookie = {name: "", value: "", domain, path: "/", secure: false, httpOnly: false, sameSite: "Lax", expires: undefined};
    const pairs = rawCookie.split(/; */);
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split(/=(.*)/, 2);
        let key = pair[0].trim();
        let value = pair[1] ? pair[1].trim() : "";
        value = value.replace(/^"(.*)"$/, "$1");
        switch (key.toLowerCase()) {
            case "domain": cookie.domain = value; break;
            case "path": cookie.path = value; break;
            case "secure": cookie.secure = true; break;
            case "httponly": cookie.httpOnly = true; break;
            case "samesite":
                const firstChar = value[0].toUpperCase();
                const restChars = value.slice(1).toLowerCase();
                cookie.sameSite = firstChar + restChars;
                break;
            case "max-age":
                const currentTime = new Date().getTime() / 1000;
                const maxAge = parseInt(value);
                cookie.expires = Math.round(currentTime + maxAge);
                break;
            case "expires":
                if (!cookie.expires) {
                    const time = new Date(value).getTime();
                    cookie.expires = Math.round(time / 1000);
                }
                break;
            default: if (i < 1) {cookie.name = key; cookie.value = value}
        }
    }
    return cookie;
}

const formatCookie = (cookie) => {
    const currentDate = new Date().toISOString();
    return {
        key: cookie.name,
        value: cookie.value,
        expires: (cookie.expires === -1) ? "Infinity" : new Date(cookie.expires * 1000).toISOString(),
        domain: cookie.domain.replace(/^\./, ""),
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        hostOnly: !cookie.domain.startsWith("."),
        creation: currentDate,
        lastAccessed: currentDate
    };
};

class CookieHandler {
    #url = ""
    #page

    constructor(url, page) {
        this.#url = new URL(url).hostname
        this.#page = page
    }

    parseCookies(rawCookies) {
        return rawCookies.map((rawCookie) => {
            return parseCookie(rawCookie, this.#url);
        });
    };

    formatCookies(cookies) {
        return cookies.map((cookie) => {
            return formatCookie(cookie);
        });
    };

    async getCookies() {
        const browserCookies = await this.#page.getCookies(this.#url);
        const toughCookies = this.formatCookies(browserCookies);

        const cookieJar = CookieJar.deserializeSync({
                rejectPublicSuffixes: true,
                cookies: toughCookies
        });

        return cookieJar;
    }

    async setCookies(rawCookies) {
        const browserCookies = this.parseCookies(rawCookies);
        for (let i = 0; i < browserCookies.length; i++) {
            const cookie = browserCookies[i];
            const badCookie = {
                name: cookie.name,
                domain: cookie.domain,
                path: cookie.path
            };

            await this.#page.deleteCookie(badCookie);
        }

        await this.#page.setCookies(browserCookies);
    }
}

export default CookieHandler;