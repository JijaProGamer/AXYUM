import { CookieJar, Cookie, canonicalDomain } from "tough-cookie";
import { DOM } from "../DOM/index.js";

import { VM, VMScript } from "vm2";
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
    if (!options) { options = {} }

    options = {
      ...options, ...{
        captureBeyondViewport: true,
        clip: null,
        encoding: "binary",
        fromSurface: true,
        fullPage: false,
        omitBackground: false,
      }
    }

    return new Promise((resolve, reject) => {
      resolve();
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
    return this.#dom.runCode(func)
  }

  $(selector) {
    return this.#window.document.querySelector(selector)
  }

  $$(selector) { }

  $x(Xpath) { }

  async setCookies(cookies) {
    let list = [];
    for (let cookie of cookies) {
      let newCookie = new Cookie(cookie);

      list.push(
        await this.#cookieJar.setCookie(
          newCookie,
          `https://youtube.com`
          //`${newCookie.secure ? "https" : "http"}://${newCookie.domain}`
        )
      );
    }

    if (this.#dom.document) {
      let host = new URL(this.#url).hostname
      let domain = host.split('.').slice(-2).join('.')

      await this.#cookieJar.setCookie(
        "CONSENT=E; Expires=Wed, 03 Sep 2025 15:54:52 GMT; Domain=youtube.com; Path=/; Secure; hostOnly=?; aAge=?; cAge=30ms",
        `https://youtube.com`
      )

      let hostCookies = (await this.#cookieJar.getCookies(host)).map((cookie) =>  `${cookie.key}=${cookie.value}`)
      let domainCookies = (await this.#cookieJar.getCookies(domain)).map((cookie) =>  `${cookie.key}=${cookie.value}`)

      this.#dom.document.cookie = [...hostCookies, ...domainCookies].join('; ')

      console.log(1, this.#dom.document.cookie.length, this.#dom.document.cookie)
    }

    return Promise.all(list);
  }

  async deleteCookie(cookie) {
    let newCookie = new Cookie({
      name: cookie.name,
      domain: cookie.domain,
      path: cookie.path,
      expires: new Date(0),
    });

    if (this.#dom.document) {
      this.#dom.document.cookie = (await this.#cookieJar.getCookies(this.#url)).map((cookie) => {
        return `${cookie.key}=${cookie.value}`;
      }).join('; ')
    }

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
    this.#cookieJar = new CookieJar(null, {
      rejectPublicSuffixes: false,
    });

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

      this.setCookies(oldCookies);
      dom.navigate(url, this.#history)
        .then(resolve)
        .catch(reject)
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
