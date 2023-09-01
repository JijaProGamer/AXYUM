// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement

class HTMLElement {    
    accessKey;
    accessKeyLabel;
    attributeStyleMap;
    isContentEditable;
    contentEditable;
    dataset;
    dir;
    draggable;
    enterKeyHint;
    hidden;
    inert;
    innerText;
    inputMode;
    popover;
    lang;
    noModule;
    nonce;
    offsetLeft;
    offsetHeight;
    offsetParent;
    offsetTop;
    offsetWidth;
    outerText;
    properties;
    spellcheck;
    style;
    tabIndex;
    title;
    translate;
    
    constructor() {
        if (this.constructor == HTMLElement) {
            throw new TypeError("Illegal constructor.")
        }
    }

    /*attachInternals() {
        throw new Error("You must call this on a initialized element.")
    }

    attachInternals() {
        throw new Error("You must call this on a initialized element.")
    }

    attachInternals() {
        throw new Error("You must call this on a initialized element.")
    }*/

    static toString() {
        return "function HTMLElement() {\n    [native code]\n}"
    }
}

HTMLElement.prototype.toString = function() {
    return "function toString() {\n    [native code]\n}"
}
export { HTMLElement }