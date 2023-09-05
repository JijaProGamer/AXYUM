// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement

class Element extends Node {    
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
        if (this.constructor == Element) {
            throw new TypeError("Illegal constructor.")
        }
    }

    static toString() {
        return "function Element() {\n    [native code]\n}"
    }
}

Element.prototype.toString = function() {
    return "function toString() {\n    [native code]\n}"
}

export { Element }