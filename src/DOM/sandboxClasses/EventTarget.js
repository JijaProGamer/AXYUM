// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget

class EventTarget {
    #listeners = new Map()

    addEventListener(type, listener, options) {
        if (typeof (options) !== "object" || Array.isArray(options)) {
            options = {}
        }

        if (!this.#listeners.has(type)) {
            this.#listeners.set(type, []);
        }

        this.#listeners.get(type).push({ listener, options });
    }

    removeEventListener(type, listener, options) {
        if (!this.#listeners.has(type)) {
            return;
        }

        const listeners = this.#listeners.get(type);
        const index = listeners.findIndex(
            (entry) => entry.listener === listener && entry.options === options
        );

        if (index !== -1) {
            listeners.splice(index, 1);

            if (listeners.length === 0) {
                this.#listeners.delete(type);
            }
        }
    }

    dispatchEvent(event) {
        if (!this.listeners.has(event.type)) {
            return;
        }

        const listeners = this.listeners.get(event.type);
        for (const listener of listeners) {
            listener.listener.call(this, event);
        }
    }

    constructor() { }
}

export { EventTarget }