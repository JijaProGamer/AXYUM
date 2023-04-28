import { JSDOM, ResourceLoader } from "jsdom"
import got from 'got';

const requestHandler = async (request, proxy, overrides = {}) => {
    if (!request.url().startsWith("http") && !request.url().startsWith("https"))
        return;

    const cookieHandler = new CookieHandler(request);
    const options = {
        cookieJar: await cookieHandler.getCookies(),
        method: overrides.method || request.method(),
        body: overrides.postData || request.postData(),
        headers: overrides.headers || setHeaders(request),
        agent: setAgent(proxy),
        responseType: "buffer",
        maxRedirects: 15,
        throwHttpErrors: false,
        ignoreInvalidCookies: true,
        followRedirect: false
    };
    try {
        const response = await got(overrides.url || request.url(), options);
        // Set cookies manually because "set-cookie" doesn't set all cookies (?)
        // Perhaps related to https://github.com/puppeteer/puppeteer/issues/5364
        const setCookieHeader = response.headers["set-cookie"];
        if (setCookieHeader) {
            await cookieHandler.setCookies(setCookieHeader);
            response.headers["set-cookie"] = undefined;
        }
        await request.respond({
            status: response.statusCode,
            headers: response.headers,
            body: response.body
        });
    } catch (error) {
        await request.abort();
    }
};

class HTTPRequest {
    #abortReasons = []

    #onFinished
    #postData
    #resourceType
    #isNavigation
    #method
    #url
    #headers
    #page

    constructor (url, page, isNavigation, resourceType, method, postData, onFinished) {
        this.#url = url
        this.#page = page
        this.#resourceType = resourceType
        this.#isNavigation = isNavigation
        this.#postData = postData
        this.#method = method
        this.#onFinished = onFinished
    }

    abort(errorCode, priority) {
        this.#onFinished({
            body: "",
            contentType: "document",
            headers: {},
            status: 499,
        })

        this.#abortReasons.push(errorCode)
    }

    respond(response) {
        this.#onFinished(response)
    }

    continue() {
        this.#onFinished({
            body: "You gae",
            contentType: "document",
            headers: {"cookies": "among us;"},
            status: 6969,
        })
    }
    
    abortErrorReason() {
        return this.#abortReasons[this.#abortReasons.length]
    }

    failure() {
        return this.#abortReasons[this.#abortReasons.length]
    }

    url () {
        return this.#url
    }

    headers () {
        return this.#headers
    }

    frame () {
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

class Page {
    #vm
    #dom
    #window
    #console
    #resourceLoader

    #interceptRequests = false

    #eventLoop = [{
        name: "request", default: true, func: (request) => {
            request.continue();
        }
    }]

    async setRequestInterception(bool) { 
        this.#interceptRequests = bool;
     }

    async goto(newPage) {
        return new Promise((resolve, reject) => {
            let newRequest = new HTTPRequest(newPage, this, true, "document", "GET", null, (result) => {
                console.log(result)

                if(result.status == 499){
                    throw new Error("") // set abort error
                }
            })

            this.emit("request", newRequest)

            /*this.#window.onload = () => {
                console.log('New page loaded!');
            };

            const { data } = await got.get('https://httpbin.org/anything', {
                json: {
                    hello: 'world'
                }
            }).json();

            const dom = new JSDOM("", {
                contentType: "text/html",
                includeNodeLocations: true,
                storageQuota: 5000000,
                runScripts: "dangerously",
                resources: resourceLoader,
            })

            this.#vm = dom.getInternalVMContext()
            this.#dom = dom
            this.#window = dom.window

            dom.virtualConsole.on("error", (text) => this.emit("console", { type: () => "error", text: () => text }))
            dom.virtualConsole.on("warn", (text) => this.emit("console", { type: () => "warning", text: () => text }))
            dom.virtualConsole.on("info", (text) => this.emit("info", { type: () => "info", text: () => text }))
            dom.virtualConsole.on("dir", (text) => this.emit("info", { type: () => "dir", text: () => text }))*/
        })
    }

    on(name, func) {
        this.#eventLoop = this.#eventLoop.filter((v) => !(v.default && name == v.name))
        this.#eventLoop.push({ name, func })
    }

    emit() {
        let args = [...arguments]
        let name = args.shift()
        let possibleEvents = this.#eventLoop.filter((e) => e.name == name)
        for (let event of possibleEvents) { event.func(...args) }
    }

    constructor(dom) {
        let resourceLoader = new ResourceLoader()
        resourceLoader.fetch = (url, options) => {
            console.log(url, options)
        }

        this.#vm = dom.getInternalVMContext()
        this.#dom = dom
        this.#window = dom.window

        dom.virtualConsole.on("error", (text) => this.emit("console", { type: () => "error", text: () => text }))
        dom.virtualConsole.on("warn", (text) => this.emit("console", { type: () => "warning", text: () => text }))
        dom.virtualConsole.on("info", (text) => this.emit("info", { type: () => "info", text: () => text }))
        dom.virtualConsole.on("dir", (text) => this.emit("info", { type: () => "dir", text: () => text }))
    }
}

class Browser {
    #pages

    async pages() {
        return this.#pages
    }

    async newPage() {
        const dom = new JSDOM("", {
            contentType: "text/html",
            includeNodeLocations: true,
            storageQuota: 5000000,
            runScripts: "dangerously",
        })

        let page = new Page(dom)
        this.#pages.push(page)

        return page
    }

    constructor() {
        this.#pages = []
    }
}

async function launch(options) {
    let browser = new Browser()
    return browser
}

export { launch }