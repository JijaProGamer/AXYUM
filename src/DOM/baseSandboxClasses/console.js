// https://developer.mozilla.org/en-US/docs/Web/API/console

class Console {
    #sandbox
    #page
    #vm

    #counts = []
    #timers = {}

    log(...args) {
        this.#page.emit("console", { type: () => "info", text: () => args.join(" ") })
    }

    dir(obj) {
        this.#page.emit("console", { type: () => "info", text: () => JSON.stringify(obj) })
    }

    table(obj) {
        this.#page.emit("console", { type: () => "info", text: () => JSON.stringify(obj) })
    }

    dirxml(obj) {
        this.dir(obj)
    }

    error(...args) {
        this.#page.emit("console", { type: () => "error", text: () => args.join() })
    }

    warn(...args) {
        this.#page.emit("console", { type: () => "warning", text: () => args.join() })
    }

    exception(...args) {
        this.error(...args)
    }

    assert(...args) {
        if (!args.shift()) return;

        for (let arg of args) {
            this.#page.emit("console", { type: () => "info", text: () => arg })
        }
    }

    count(label = "default") {
        if (!this.#counts[label])
            this.#counts[label] = 0

        this.#counts[label] += 1
        this.#page.emit("console", { type: () => "info", text: () => `${label}: ${this.#counts[label]}` })
    }

    countReset(label = "default") {
        this.#counts[label] = 0
    }

    time(label = "default") {
        this.#timers[label] = Date.now();
    }

    timeEnd(label = "default") {
        if (this.#timers[label] = 0) {
            this.warn(`Timer "${label}" doesn't exist.`)
            return;
        }

        this.#page.emit("console", { type: () => "info", text: () => `${label}: ${Date.now() - this.#timers[label]}ms - timer ended` })
        this.#timers[label] = 0;
    }

    timeLog(label = "default") {
        if (this.#timers[label] = 0) {
            this.warn(`Timer "${label}" doesn't exist.`)
            return;
        }

        this.#page.emit("console", { type: () => "info", text: () => `${label}: ${Date.now() - this.#timers[label]}ms` })
    }

    clear() {

    }

    group() {

    }

    groupCollapsed() {

    }

    groupEnd() {

    }

    profile() {

    }

    profileEnd() {

    }

    timeStamp() {

    }

    trace() {

    }

    toString() {
        return "[object console]";
    }

    constructor(sandbox, DOM, vm) {
        this.#sandbox = sandbox
        this.#page = DOM.page
        this.#vm = vm
    }
}

export { Console }