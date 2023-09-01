import { parse } from 'node-html-parser';
import { NodeVM, VM, VMScript } from "vm2";

import { HTTPRequest } from "../Networking/index.js";
import { Sandbox } from './sandbox.js';

class DOM {
    history = [];

    vm;
    sandbox;
    document;
    window;
    cookieJar;

    url;
    page;

    consoleCounts = {};

    intervals = [];
    timeouts = [];

    runCode(code) {
        return new Promise((resolve, reject) => {
            try {
                if(typeof code == "string"){
                    code = code.trim()

                    code = `() => {${code}}`
                }

                let result = this.vm.run(`
                    try {
                        (${code})()
                    } catch(err) {
                        console.error(err)
                    }
                `)

                resolve(result)
            } catch (err) {
                reject(err)
            }
        })
    }

    kill() {
        for (let interval of this.intervals) {
            clearInterval(interval)
        }

        for (let timeout of this.timeouts) {
            clearTimeout(timeout)
        }
    }

    makeRequest(opts) {
        return new Promise((resolve, reject) => {
            let headers = { // improve in the future
                "Host": new URL(opts.url).host,

                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7,he;q=0.6",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
                "Upgrade-Insecure-Requests": "1",
            }

            if(new URL(opts.url).origin == new URL(this.url).origin){
                headers["Origin"] = new URL(this.url).origin
            }

            if(opts.headers){
                headers = {...headers, ...opts.headers}
            }

            if(opts.referer){
                headers["Referer"] = opts.referer.origin + opts.referer.pathname
            }

            let newRequest = new HTTPRequest(
                opts.url,
                this.page,
                opts.isNavigation,
                opts.resourceType,
                opts.method,
                opts.postData,
                "", //this.#browser.proxy || "",
                headers,
                (result) => {
                    if (result.status < 200 || result.status > 299) {
                        reject(new Error("Server send non 2xx status code"))
                    } else {
                        resolve(result)
                    }
                }
            );

            this.page.emit("request", newRequest);
        })
    }

    navigate(url, history) {
        return new Promise((resolve, reject) => {
            try {
                new URL(url)
            } catch(err){
                url = `http://${url}`
            }

            let referer = history.at(-2)
            if (!referer || referer == "about:blank" || referer.startsWith("chrome://"))
                referer = undefined

            this.makeRequest({
                referer: referer ? new URL(referer) : null,
                url,
                resourceType: "document",
                method: "GET",
                postData: null,
                isNavigation: true,
                headers: {
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                    "Sec-Fetch-User": "?1"
                }
            }
            ).then((result) => {
                this.document = parse(result.body/*.toString()*/, {
                    lowerCaseTagName: false
                })

                this.sandbox.setDocument({
                    document: this.document,
                })
                .then(resolve)
                .catch(reject)
            }).catch(reject)
        })
    }

    constructor(options) {
        this.url = options.url;
        this.history = options.history;
        this.page = options.page;
        this.cookieJar = options.cookieJar;

        this.vm = new VM({
            allowAsync: true,
            timeout: 1000,
        });

        this.sandbox = new Sandbox({
            vm: this.vm,
            DOM: this,
        })
    }
}

export { DOM };
