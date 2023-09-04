import { VM } from "vm2";

import { HTMLElement } from "./sandboxClasses/HTMLElement.js";
import { Console } from "./baseSandboxClasses/console.js";

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
    "icon": "image",
    "image_src": "image",
}

let banned_relations = [
    "canonical",
    "alternate",
    "search"
]

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
        if (url.startsWith("/")) {
            url = url.slice(1)
            url = `${new URL(this.#DOM.url).origin}/${url}`
        }

        if (url.startsWith("./")) {
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

            for (let [index, toDownload] of this.#toDownload.entries()) {
                new Promise((resolve, reject) => {
                    this.downloadContent(toDownload).then((result) => {
                        this.#resources[index] = { ...result, failed: false, ...toDownload }
                        resolve()
                    })
                        .catch((err) => {
                            this.#resources[index] = { failed: true, ...toDownload }
                            reject(err)
                        })
                })
                    .then(() => { })
                    .catch(() => { })
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
                    if(banned_relations.includes(node.attributes.rel)) continue;

                    let toDownloadData = {
                        type: relations[node.attributes.rel] || node.attributes.rel,
                        href: node.attributes.href
                    }

                    if(node.attributes.rel == "preload" && node.attributes.as == "script"){
                        toDownloadData.type = "script"
                    }

                    this.#toDownload.push(toDownloadData)
                }
            }

            this.#vm.freeze(this.#DOM.document, "document")
            await this.downloadAllContent()

            for (let [index, download] of this.#toDownload.entries()) {
                if (download.type !== "script") continue;
                if (download.failed) continue;

                await this.#DOM.runCode(this.#resources[index].body.toString()).catch(() => { })
            }

            /*for(let [href, result] of Object.entries(this.#resources)){
                if(result.failed) continue;
                if(result.type !== "script") continue;

                await this.#DOM.runCode(result.body.toString()).catch(() => { })
            }*/

            for (let node of nodes) {
                if (node.tagName !== "SCRIPT") continue;

                this.#DOM.runCode(node.innerHTML).catch(() => { })
            }

            resolve()
        })
    }

    constructor(options) {
        this.#DOM = options.DOM

        let vmSandbox = {
            location: {},
            HTMLElement,
            URL,
            fetch: (url) => {console.log(url)},
            setInterval: (func, time) => {
                let id = setInterval(() => this.runCode(func), time)
                this.#DOM.intervals.push(id)
            },
            setTimeout: (func) => {
                let id = setTimeout(() => this.runCode(func))
                this.#DOM.timeouts.push(id)
            },
            console: new Console(this, this.#DOM, this.#vm),
        } 

        /*for (let [name, value] of Object.entries(vmSandbox)) {
            this.#vm.freeze(value, name)
        }*/

        this.#vm = new VM({
            allowAsync: true,
            timeout: 1000,
            sandbox: vmSandbox
        });

        this.#DOM.vm = this.#vm

        this.#DOM.runCode(() => {
            window = globalThis = global
            global = undefined
        })

        //this.#DOM.runCode(() => console.log(console.toString.toString()))

        //this.#DOM.runCode(() => fetch("https://www.github.com").then(console.log))
        //console.log(this.#DOM.runCode(() => HTMLElement.toString.toString()))
        //this.#DOM.runCode(() => {setInterval(() => console.log("OK!!"), 1000)} )
    }
}

export { Sandbox };
