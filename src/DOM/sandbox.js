import { HTMLElement } from "./sandboxClasses/HTMLElement.js";

function getAllChildNodes(node) {
    const nodes = [];

    nodes.push(node);

    if (node.childNodes.length > 0) {
        node.childNodes.forEach(childNode => {
            nodes.push(...getAllChildNodes(childNode))
        })
    }

    return nodes;
}

let relations = {
    "stylesheet": "style",
    "modulepreload": "script",
    "icon": "image"
}

class Sandbox {
    #vm;
    #DOM;

    #resources = {};
    #toDownload = [];

    downloadContent(content) {
        let referer = this.#DOM.history.at(-2)
        if (!referer || referer == "about:blank" || referer.startsWith("chrome://"))
            referer = undefined

        let url = content.href
        if(url.startsWith("/")){
            url = url.slice(1)
            url = `${new URL(this.#DOM.url).origin}/${url}`
        }

        if(url.startsWith("./")){
            url = url.slice(2)
            url = `${new URL(this.#DOM.url).origin}/${url}`
        }

        let mode = "no-cors"
        let origin = "cross-site"
        if (new URL(this.#DOM.url).origin == new URL(url).origin) {
            mode = "same-origin"
            origin = "same-origin"
        }

        return this.#DOM.makeRequest({
            referer: referer ? new URL(referer) : null,
            url: url,
            resourceType: content.type,
            method: "GET",
            postData: null,
            isNavigation: false,
            headers: {
                "Sec-Fetch-Dest": content.type,
                "Sec-Fetch-Mode": mode,
                "Sec-Fetch-Site": origin
            }
        })
    }

    downloadAllContent() {
        return new Promise((resolve, reject) => {
            let finished = 0

            for (let toDownload of this.#toDownload) {
                new Promise((resolve, reject) => {
                    this.downloadContent(toDownload).then((result) => {
                        this.#resources[toDownload.href] = {...result, failed: false, ...toDownload}
                        resolve()
                    })
                    .catch((err) => {
                        this.#resources[toDownload.href] = {failed: true, ...toDownload}
                        reject(err)
                    })
                })
                .then(() => {})
                .catch(() => {})
                .finally(() => finished += 1)
            }

            let interval = setInterval(() => {
                if (finished == this.#toDownload.length) {
                    clearInterval(interval)
                    resolve()
                }
            }, 250)

            this.#DOM.intervals.push(interval)
        })
    }

    setDocument(options) {
        return new Promise(async (resolve, reject) => {
            let nodes = getAllChildNodes(options.document)

            for (let node of nodes) {
                if (node.tagName == "LINK") {
                    this.#toDownload.push({
                        type: relations[node.attributes.rel],
                        href: node.attributes.href
                    })
                }
            }
            
            this.#vm.freeze(this.#DOM.document, "document")
            await this.downloadAllContent()

            for(let [href, result] of Object.entries(this.#resources)){
                if(result.failed) continue;
                if(result.type !== "script") continue;

                await this.#DOM.runCode(result.body.toString()).catch(() => { })
            }

            for (let node of nodes) {
                if (node.tagName !== "SCRIPT") continue;

                await this.#DOM.runCode(node.innerHTML).catch(() => { })
            }
        })
    }

    constructor(options) {
        this.#vm = options.vm
        this.#DOM = options.DOM

        let vmSandbox = {
            location: {},
            HTMLElement,
            URL,
            setInterval: (func, time) => {
                let id = setInterval(() => this.runCode(func), time)
                this.#DOM.intervals.push(id)
            },
            setTimeout: (func) => {
                let id = setTimeout(() => this.runCode(func))
                this.#DOM.timeouts.push(id)
            },
            console: {
                log: (...args) => {
                    for (let arg of args) {
                        this.#DOM.page.emit("console", { type: () => "info", text: () => arg })
                    }
                },
                error: (...args) => {
                    for (let arg of args) {
                        this.#DOM.page.emit("console", { type: () => "error", text: () => arg })
                    }
                },
                assert: (...args) => {
                    if (!args.shift()) return;

                    for (let arg of args) {
                        this.#DOM.page.emit("console", { type: () => "info", text: () => arg })
                    }
                },
                count: (label = "default") => {
                    if (!this.#DOM.consoleCounts[label])
                        this.#DOM.consoleCounts[label] = 0

                    this.#DOM.consoleCounts[label] += 1
                    this.#DOM.page.emit("console", { type: () => "info", text: () => `${label}: ${this.#DOM.consoleCounts[label]}` })
                } // add all console methods
            }
        }

        for (let [name, value] of Object.entries(vmSandbox)) {
            this.#vm.freeze(value, name)
        }

        this.#DOM.runCode(() => {
            window = globalThis = global
            global = undefined
        })

        console.log(this.#DOM.runCode(() => HTMLElement.toString.toString()))
        //this.#DOM.runCode(() => {setInterval(() => console.log("OK!!"), 1000)} )
    }
}

export { Sandbox };
