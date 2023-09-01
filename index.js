import { Page } from "./src/Page/index.js"

class Browser {
    #pages
    #options

    async pages() {
        return this.#pages
    }

    async newPage() {
        let page = new Page(this)
        this.#pages.push(page)

        return page
    }

    constructor(options) {
        this.#pages = []
        this.options = options;
    }
}

async function launch(options) {
    let browser = new Browser(options)
    return browser
}

export { launch }