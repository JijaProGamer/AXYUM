import { launch } from "./index.js";

launch().then(async (browser) => {
    let page = await browser.newPage()

    page.on("console", console.log)

    page.on('request', request => {
        if (request.resourceType() === 'image')
            request.abort();
        else
            request.continue();
    });

    await page.goto("https://github.com/puppeteer/puppeteer", { waitUntil: "networkidle0" })
    console.log(page)
})