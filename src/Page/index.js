import { CookieJar } from "tough-cookie";
import { DOM } from "../DOM/index.js";

import { VM, VMScript } from "vm2";
import { Cookie } from "tough-cookie";
import { HTTPRequest } from "../Networking/index.js";

class Page {
  #history = [];

  #vm;
  #dom;
  #window;
  #cookieJar;

  #url;
  #browser;

  #events = [
    {
      name: "request",
      default: true,
      func: (request) => {
        request.continue();
      },
    },
  ];

  setRequestInterception() { }

  setViewport(viewport) { }

  screenshot(options) {
    return new Promise((resolve, reject) => {
      /*if(!(this.#browser.options.executablePath && existsSync(this.#browser.options.executablePath)))
        throw new Error("You need to provide executablePath at launch for the ability to screenshot")
      
      puppeteer.launch({
        headless: "new",
        executablePath: this.#browser.options.executablePath
      }).then(async (browser) => {
        try {
          function cancel(err) {throw new Error(err)}

          let page = await browser.newPage().catch(cancel)
          await page.setJavaScriptEnabled(false).catch(cancel)
          await page.setContent(this.#dom.serialize()).catch(cancel)

          resolve(await page.screenshot(options).catch(cancel))

          await browser.close().catch(cancel)
        } catch (err) {
          reject(err)
        }
      })*/
    })
  }

  type(selector, text) { }

  waitForSelector(selector, options) { }

  click(selector) {
    return new Promise((resolve, reject) => {
      let element = this.$(selector)
      if (!element) reject(new Error("Element with this selector doesn't exist"))

      try {
        var evt = this.#window.document.createEvent("HTMLEvents");
        evt.initEvent("click", false, true);

        element.dispatchEvent(evt)
        resolve()
      } catch (err) {
        reject(new Error(`Unable to click. Error: ${err}`))
      }
    })
  }

  content() {
    return this.#dom.serialize()
  }

  evaluate(func) {
    if (typeof func !== "function")
      throw new Error("AXYUM only supports evaluating function");

    return runInContext(`(${func})()`, this.#vm)
  }

  $(selector) {
    return this.#window.document.querySelector(selector)
  }

  $$(selector) { }

  $x(Xpath) { }

  setCookies(cookies) {
    let list = [];
    for (let cookie of cookies) {
      let newCookie = new Cookie(cookie);

      list.push(
        this.#cookieJar.setCookie(
          newCookie,
          `${newCookie.secure ? "https" : "http"}://www.${newCookie.domain}`
        )
      );
    }

    return Promise.all(list);
  }

  deleteCookie(cookie) {
    let newCookie = new Cookie({
      name: cookie.name,
      domain: cookie.domain,
      path: cookie.path,
      expires: new Date(0),
    });

    return this.#cookieJar.setCookie(
      newCookie,
      `${newCookie.secure ? "https" : "http"}://www.${newCookie.domain}`
    );
  }

  async getCookies(url) {
    return this.#cookieJar.getCookies(url);
  }

  async navigate(url, oldUrl) {
    let oldCookies = [];

    if (this.#cookieJar) {
      oldCookies = await this.getCookies(url)
    }

    this.#url = url;
    this.#cookieJar = new CookieJar(null);
    this.setCookies(oldCookies);

    return new Promise((resolve, reject) => {
      this.#dom?.kill()

      const dom = new DOM({
        url: url,
        history: this.#history,
        cookieJar: this.#cookieJar,
        page: this
      });

      this.#dom = dom
      this.#history.push(url);

      dom.navigate(url, this.#history)
        .then(resolve)
        .catch(reject)

      /*
      let newRequest = new HTTPRequest(
        url,
        this,
        true,
        "document",
        "GET",
        null,
        this.#browser.proxy || "",
        { // switch headers in the future
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7,he;q=0.6",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
          "upgrade-insecure-requests": "1",
        },
        (result) => {
          console.log(result)
          if (result.status < 200 || result.status > 299) {
            reject(new Error("Server send non 2xx status code"))
          } else {

          }
        }
      );

      this.emit("request", newRequest);*/
    });
  }

  goto(newPage) {
    return this.navigate(newPage, this.#url);
  }

  url() {
    return this.#url;
  }

  on(name, func) {
    this.#events = this.#events.filter(
      (v) => !(v.default && name == v.name)
    );
    this.#events.push({ name, func });
  }

  emit() {
    let args = [...arguments];
    let name = args.shift();
    let possibleEvents = this.#events.filter((e) => e.name == name);
    for (let event of possibleEvents) {
      event.func(...args);
    }
  }

  constructor(browser) {
    this.#browser = browser;
    this.navigate("about:blank");
  }
}

export { Page };
