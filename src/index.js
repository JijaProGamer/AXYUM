import { JSDOM } from "jsdom"

const dom = new JSDOM("", {
    url: "https://github.com/jsdom/jsdom",
    referrer: "https://github.com/",
    contentType: "text/html",
    includeNodeLocations: true,
    storageQuota: 5000000,         
    runScripts: "dangerously"                                                                                           
})

const domVM = dom.getInternalVMContext()
const window = dom.window
const domConsole = dom.virtualConsole;


console.log(domConsole)