// https://developer.mozilla.org/en-US/docs/Web/API/Node

import { EventTarget } from "./EventTarget.js"

const NodeTypes = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
}

class Node extends EventTarget {
    baseURI = ""
    nodeName = ""
    nodeType = NodeTypes.ELEMENT_NODE
    isConnected = false

    childNodes = []
    firstChild = null
    lastChild = null
    nextSibling = null
    previousSibling = null
    parentNode = null
    parentElement = null
    ownerDocument = null

    nodeValue = null
    textContent = null

    DOCUMENT_POSITION_DISCONNECTED = 1
    DOCUMENT_POSITION_PRECEDING = 2
    DOCUMENT_POSITION_FOLLOWING = 4
    DOCUMENT_POSITION_CONTAINS = 8
    DOCUMENT_POSITION_CONTAINED_BY = 16
    DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32

    appendChild(aChild) {
        if (aChild !== null && aChild instanceof Node) {
            const parentNode = this.parentNode;

            if (
                parentNode &&
                (parentNode.nodeType === NodeTypes.DOCUMENT_NODE ||
                    parentNode.nodeType === NodeTypes.DOCUMENT_FRAGMENT_NODE ||
                    parentNode.nodeType === NodeTypes.ELEMENT_NODE)
            ) {
                throw new HierarchyRequestError("The parent of aChild is not a Document, DocumentFragment, or an Element.");
            }

            let ancestor = this;
            while (ancestor) {
                if (ancestor === aChild) {
                    throw new HierarchyRequestError("Inserting aChild would lead to a cycle.");
                }
                ancestor = ancestor.parentNode;
            }

            if (
                aChild.nodeType !== NodeTypes.DOCUMENT_FRAGMENT_NODE &&
                aChild.nodeType !== NodeTypes.DOCUMENT_TYPE_NODE &&
                aChild.nodeType !== NodeTypes.ELEMENT_NODE &&
                aChild.nodeType !== NodeTypes.TEXT_NODE
            ) {
                throw new Error("aChild is not a valid node type.");
            }

            if (this.nodeType === NodeTypes.TEXT_NODE && parentNode.nodeType === NodeTypes.DOCUMENT_NODE) {
                throw new Error("Current node is a Text, and its parent is a Document.");
            }

            if (this.nodeType === NodeTypes.DOCUMENT_TYPE_NODE && parentNode.nodeType !== NodeTypes.DOCUMENT_NODE) {
                throw new Error("Current node is a DocumentType, and its parent is not a Document.");
            }

            if (parentNode.nodeType === NodeTypes.DOCUMENT_NODE && aChild.nodeType === NodeTypes.DOCUMENT_FRAGMENT_NODE) {
                if (
                    aChild.childNodes.length !== 1 ||
                    (aChild.firstChild.nodeType === NodeTypes.ELEMENT_NODE && aChild.firstChild.nextSibling)
                ) {
                    throw new Error("Insertion would lead to a Document with more than one Element child.");
                }
            }

            if (aChild.parentNode) {
                aChild.parentNode.removeChild(aChild);
            }

            aChild.parentNode = this;

            this.childNodes.push(aChild);

            if (!this.firstChild) {
                this.firstChild = aChild;
            }
            this.lastChild = aChild;

            if (this.isConnected) {
                aChild._updateConnected(true);
            }

            const event = new Event('DOMNodeInserted');
            event.target = aChild;
            this.dispatchEvent(event);

            return aChild;
        } else {
            throw new Error("Failed to execute 'appendChild': The new child element is not a Node.");
        }
    }

    cloneNode(deep = false) {
        const clonedNode = new Node();

        for (const attributeName in this) {
            if (this.hasOwnProperty(attributeName) && typeof this[attributeName] !== 'function') {
                clonedNode[attributeName] = this[attributeName];
            }
        }

        clonedNode.parentNode = null;
        clonedNode.parentElement = null;
        clonedNode.previousSibling = null;
        clonedNode.nextSibling = null;

        if (deep) {
            for (const childNode of this.childNodes) {
                const clonedChild = childNode.cloneNode(true);
                clonedNode.appendChild(clonedChild);
            }
        }

        return clonedNode;
    }

    compareDocumentPosition(otherNode) {

    }


    contains(otherNode) {
        if (otherNode === null) {
            return false;
        }

        if (this === otherNode) {
            return true;
        }

        for (const childNode of this.childNodes) {
            if (childNode.contains(otherNode)) {
                return true;
            }
        }

        return false;
    }


    getRootNode() {
        if (options.composed) {
            let rootNode = this;

            while (rootNode.parentNode) {
                rootNode = rootNode.parentNode;
            }

            return rootNode;
        }

        if (this.parentNode) {
            return this.parentNode.getRootNode(options);
        }

        return this;
    }

    hasChildNodes() {
        return this.childNodes.length > 0
    }

    insertBefore() {

    }

    isDefaultNamespace() {

    }

    isEqualNode(otherNode) {
        if (otherNode === null) {
            return false;
        }

        if (this.nodeType !== otherNode.nodeType) {
            return false;
        }

        if (this.nodeType === NodeTypes.ELEMENT_NODE) {
            if (!this.#_attributesEqual(this.attributes, otherNode.attributes) ||
                this.childNodes.length !== otherNode.childNodes.length) {
                return false;
            }
        } else if (this.nodeType === NodeTypes.TEXT_NODE ||
            this.nodeType === NodeTypes.CDATA_SECTION_NODE) {

                if (this.nodeValue !== otherNode.nodeValue) {
                return false;
            }
        }

        for (let i = 0; i < this.childNodes.length; i++) {
            if (!this.childNodes[i].isEqualNode(otherNode.childNodes[i])) {
                return false;
            }
        }

        return true;
    }

    #_attributesEqual(attrList1, attrList2) {
        if (attrList1.length !== attrList2.length) {
            return false;
        }

        for (const attr1 of attrList1) {
            let found = false;
            for (const attr2 of attrList2) {
                if (attr1.name === attr2.name && attr1.value === attr2.value) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        return true;
    }

    isSameNode(otherNode) {
        return this === otherNode
    }

    lookupPrefix() {

    }

    lookupNamespaceURI() {

    }

    normalize() {
        for (const childNode of this.childNodes) {
            childNode.normalize();
        }

        for (let i = 0; i < this.childNodes.length - 1; i++) {
            const currentNode = this.childNodes[i];
            const nextNode = this.childNodes[i + 1];

            if (
                currentNode.nodeType === NodeTypes.TEXT_NODE &&
                nextNode.nodeType === NodeTypes.TEXT_NODE
            ) {
                currentNode.nodeValue += nextNode.nodeValue;

                this.removeChild(nextNode);

                i--;
            }
        }
    }

    removeChild(child) {
        if (child === null) {
            throw new TypeError("Failed to execute 'removeChild': The child is null.");
        }

        const index = this.childNodes.indexOf(child);
        if (index === -1) {
            throw new Error("Failed to execute 'removeChild': The child is not a child of the node.");
        }

        const removedNode = this.childNodes.splice(index, 1)[0];

        removedNode.parentNode = null;
        removedNode.parentElement = null;

        const event = new Event('DOMNodeRemoved');
        event.target = removedNode;
        this.dispatchEvent(event);

        return removedNode;
    }

    replaceChild(newChild, oldChild) {
        if (oldChild === null || newChild === null) {
            throw new TypeError("Failed to execute 'replaceChild': Both oldChild and newChild must not be null.");
        }

        if (oldChild.parentNode !== this) {
            throw new Error("Failed to execute 'replaceChild': The parent of oldChild is not the current node.");
        }

        const parentNode = this.parentNode;
        if (
            (parentNode && parentNode.nodeType !== NodeTypes.DOCUMENT_NODE && parentNode.nodeType !== NodeTypes.DOCUMENT_FRAGMENT_NODE && parentNode.nodeType !== NodeTypes.ELEMENT_NODE) ||
            (newChild.nodeType !== NodeTypes.DOCUMENT_FRAGMENT_NODE && newChild.nodeType !== NodeTypes.DOCUMENT_TYPE_NODE && newChild.nodeType !== NodeTypes.ELEMENT_NODE && newChild.nodeType !== NodeTypes.TEXT_NODE)
        ) {
            throw new Error("Failed to execute 'replaceChild': Constraints of the DOM tree are violated.");
        }

        if (this.nodeType === NodeTypes.TEXT_NODE && parentNode.nodeType === NodeTypes.DOCUMENT_NODE) {
            throw new Error("Failed to execute 'replaceChild': Current node is a Text, and its parent is a Document.");
        }

        if (this.nodeType === NodeTypes.DOCUMENT_TYPE_NODE && parentNode.nodeType !== NodeTypes.DOCUMENT_NODE) {
            throw new Error("Failed to execute 'replaceChild': Current node is a DocumentType, and its parent is not a Document.");
        }

        if (parentNode.nodeType === NodeTypes.DOCUMENT_NODE && newChild.nodeType === NodeTypes.DOCUMENT_FRAGMENT_NODE) {
            if (
                newChild.childNodes.length !== 1 ||
                (newChild.firstChild.nodeType === NodeTypes.ELEMENT_NODE && newChild.firstChild.nextSibling)
            ) {
                throw new Error("Failed to execute 'replaceChild': Replacement would lead to a Document with more than one Element child.");
            }
        }

        if (this.nextSibling && this.nextSibling.nodeType === NodeTypes.DOCUMENT_TYPE_NODE) {
            throw new Error("Failed to execute 'replaceChild': Replacement would lead to an Element node before a DocumentType node.");
        }

        const removeEvent = new Event('DOMNodeRemoved');
        removeEvent.target = oldChild;
        this.dispatchEvent(removeEvent);

        const index = this.childNodes.indexOf(oldChild);
        this.childNodes.splice(index, 1);

        oldChild.parentNode = null;
        oldChild.parentElement = null;
        oldChild.previousSibling = null;
        oldChild.nextSibling = null;

        const insertEvent = new Event('DOMNodeInserted');
        insertEvent.target = newChild;
        this.dispatchEvent(insertEvent);

        this.childNodes.splice(index, 0, newChild);

        newChild.parentNode = this;
        newChild.parentElement = this;
        newChild.previousSibling = oldChild.previousSibling;
        newChild.nextSibling = oldChild.nextSibling;

        return oldChild;
    }

    constructor() {
        super()
    }
}

export { Node, NodeTypes }