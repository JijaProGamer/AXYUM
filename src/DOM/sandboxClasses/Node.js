// https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model

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

class Node {
    baseURI = ""
    nodeName = ""
    isConnected = false

    childNodes = []
    firstChild = null
    lastChild = null
    nextSibling = null
    previousSibling = null
    parentNode = null
    parentElement = null

    nodeValue = null
    ownerDocument = null


    constructor() {}
}

export { Node, NodeTypes }