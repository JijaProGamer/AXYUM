import { launch } from "./index.js";

function sleep(ms){return new Promise(r => setTimeout(r, ms))}

launch({
    executablePath: "/snap/bin/chromium",
}).then(async (browser) => {
    let page = await browser.newPage()

    /*page.on('request', request => {
        if (request.resourceType() === 'image')
            request.abort();
        else
            request.continue();
    });*/

    page.on("console", (message) => console.log(`${message.type()}: ${message.text()}`))

    //await page.goto("https://www.youtube.com/watch?v=Zktrwiknq64", { waitUntil: "networkidle0" })
    //await page.goto("https://www.bloxxy.net", { waitUntil: "networkidle0" })

    await sleep(1000)

    await page.screenshot({path: "e.png", fullPage: true})

    console.log("Done")
})