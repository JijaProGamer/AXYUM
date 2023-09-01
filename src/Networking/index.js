import got from 'got';
import * as proxyAgent from 'proxy-agent-v2'
import CookieHandler from '../Cookies/index.js';

class HTTPRequest {
    #abortReasons = []

    #proxy
    #onFinished
    #postData
    #resourceType
    #isNavigation
    #method
    #url
    #headers
    #page

    constructor(url, page, isNavigation, resourceType, method, postData, proxy, headers, onFinished) {
        this.#url = url
        this.#page = page
        this.#resourceType = resourceType
        this.#isNavigation = isNavigation
        this.#postData = postData
        this.#method = method
        this.#proxy = proxy
        this.#onFinished = onFinished
        this.#headers = headers
    }

    abort(errorCode, priority) {
        this.#onFinished({
            body: errorCode,
            headers: {},
            status: 499,
        })

        this.#abortReasons.push(errorCode)
    }

    respond(response) {
        this.#onFinished(response)
    }

    async continue() {
        if (!this.#url.startsWith("http") && !this.#url.startsWith("https")) {
            if (this.#url == "about:blank") {
                return this.#onFinished({
                    status: 200,
                    headers: {},
                    body: Buffer.from(""),
                });
            }

            if (this.#url.startsWith("chrome://")) {
                return this.#onFinished({
                    status: 501 ,
                    headers: {},
                    body: Buffer.from("Not implemented!"), // not implemented
                });
            }

            return this.abort("request is not http or https");
        }

        try {
            let cookieHandler = new CookieHandler(this.#url, this.#page)

            const options = {
                cookieJar: await cookieHandler.getCookies(),
                method: this.#method,
                headers: this.#headers,
                responseType: "buffer",
                maxRedirects: 10,
                throwHttpErrors: false,
                ignoreInvalidCookies: true,
                followRedirect: true
            };

            if (this.#postData) {
                options.body = this.#postData
            }

            if (!(this.#proxy == "" || this.#proxy == "direct://") && this.#proxy) {
                options.agent = proxyAgent(this.#proxy)
            }

            got(this.#url, options).then((response) => {
                const setCookieHeader = response.headers["set-cookie"];
                if (setCookieHeader) {
                    cookieHandler.setCookies(setCookieHeader);
                    response.headers["set-cookie"] = undefined;
                }

                this.#onFinished({
                    status: response.statusCode,
                    headers: response.headers,
                    body: response.body
                });
            }).catch((err) => {
                this.abort(err)
            })
        } catch (err) {
            this.abort(err)
        }
    }

    abortErrorReason() {
        return this.#abortReasons[this.#abortReasons.length]
    }

    failure() {
        return this.#abortReasons[this.#abortReasons.length]
    }

    url() {
        return this.#url
    }

    headers() {
        return this.#headers
    }

    frame() {
        return this.#page
    }

    resourceType() {
        return this.#resourceType
    }

    isNavigationRequest() {
        return this.#isNavigation
    }

    method() {
        return this.#method
    }

    postData() {
        return this.#postData
    }
}

export { HTTPRequest }