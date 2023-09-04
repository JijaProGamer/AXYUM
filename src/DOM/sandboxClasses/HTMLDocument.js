// https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model

import { Node } from "./Node.js";

class HTMLDocument extends Node {
    #dom

    cookie = ""


    log(...args) {
        
    }

    toString() {
        return "[object HTMLDocument]";
    }

    constructor(DOM, rawDocument) {
        super();
        this.#dom = DOM

        //console.log(rawDocument)
    }
}

export { HTMLDocument }