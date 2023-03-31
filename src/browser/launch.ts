import { NodeAPI } from "node-red";

import puppeteer, {
  Page,
  ConnectOptions,
  Browser,
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
} from "puppeteer-core";

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import UAPlugin from "puppeteer-extra-plugin-anonymize-ua";

import {
  PuppeteerNode,
  PuppeteerNodeConfig,
  PuppeteerMessageInFlow,
} from "../types/PuppeteerConfigType";

type LaunchOptions = ConnectOptions &
  BrowserConnectOptions &
  BrowserLaunchArgumentOptions;

const enableStealth = async (page: Page): Promise<void> => {
  await page.evaluateOnNewDocument(`() => {
      Object.defineProperty(window, 'navigator', {
        value: new Proxy(navigator, {
          has: (target, key) =>
            key === 'webdriver' ? false : key in target,
          get: (target, key) => {
            if (key === 'webdriver') {
              return undefined
            }

            if (typeof target[key] === 'function') {
              return target[key].bind(target)
            }

            return target[key]
          }
        })
      })
    })()`);

  await page.evaluateOnNewDocument(`() => {
      const originalQuery = window.navigator.permissions.query
      return (window.navigator.permissions.query = (padrameters) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission })
        }

        return originalQuery(parameters)
      })
    })()`);
};

const checkStealth = async (page: Page): Promise<boolean> => {
  await page.goto("about:blank");

  // This is a base64 encoded string of the following code
  //
  // const checkUserAgent = () => !/HeadlessChrome/.test(navigator.userAgent),
  //   webdriverTest = () => !navigator.webdriver,
  //   chromeTest = () => window.chrome,
  //   permissionTest = async () => {
  //     try {
  //       const e = await navigator.permissions.query({ name: "notifications" });
  //       return !("denied" === Notification.permission && "prompt" === e.state);
  //     } catch (e) {
  //       return !1;
  //     }
  //   },
  //   pluginTest = () => !!navigator.plugins.length,
  //   languageTest = () => navigator.languages && navigator.languages.length;
  // (() =>
  //   Promise.resolve(
  //     [
  //       checkUserAgent,
  //       webdriverTest,
  //       chromeTest,
  //       permissionTest,
  //       pluginTest,
  //       languageTest,
  //     ].every((e) => e())
  //   ))();

  const steathTest = `
        eval(atob('Y29uc3QgY2hlY2tVc2VyQWdlbnQ9KCk9PiEvSGVhZGxlc3NDaHJvbW
        UvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksd2ViZHJpdmVyVGVzdD0oKT0+IW5
        hdmlnYXRvci53ZWJkcml2ZXIsY2hyb21lVGVzdD0oKT0+d2luZG93LmNocm9tZSxw
        ZXJtaXNzaW9uVGVzdD1hc3luYygpPT57dHJ5e2NvbnN0IGU9YXdhaXQgbmF2aWdhd
        G9yLnBlcm1pc3Npb25zLnF1ZXJ5KHtuYW1lOiJub3RpZmljYXRpb25zIn0pO3JldH
        VybiEoImRlbmllZCI9PT1Ob3RpZmljYXRpb24ucGVybWlzc2lvbiYmInByb21wdCI
        9PT1lLnN0YXRlKX1jYXRjaChlKXtyZXR1cm4hMX19LHBsdWdpblRlc3Q9KCk9PiEh
        bmF2aWdhdG9yLnBsdWdpbnMubGVuZ3RoLGxhbmd1YWdlVGVzdD0oKT0+bmF2aWdhd
        G9yLmxhbmd1YWdlcyYmbmF2aWdhdG9yLmxhbmd1YWdlcy5sZW5ndGg7KCgpPT5Qcm
        9taXNlLnJlc29sdmUoW2NoZWNrVXNlckFnZW50LHdlYmRyaXZlclRlc3QsY2hyb21
        lVGVzdCxwZXJtaXNzaW9uVGVzdCxwbHVnaW5UZXN0LGxhbmd1YWdlVGVzdF0uZXZl
        cnkoZT0+ZSgpKSkpKCk7'))
        `.replace(/[\n\r]/g, "");

  const isValid = await page.evaluate(steathTest);

  return !!isValid;
};

const createPage = async (
  stealth?: boolean,
  browser?: Browser
): Promise<Page> => {
  if (!browser) {
    throw new Error("Missing browser");
  }

  if (stealth) {
    const page = await browser.newPage();
    await enableStealth(page);
    return page;
  }

  return browser.newPage();
};

const launchPuppeteer = async (
  options: LaunchOptions,
  node: PuppeteerNode,
  config: PuppeteerNodeConfig
): Promise<Browser> => {
  const isRemoteInstance = options.browserWSEndpoint !== undefined;

  const launchOptions: LaunchOptions = {
    ...options,
    headless: !!config.headless,
    args: [],
  };

  if (launchOptions.browserWSEndpoint) {
    delete launchOptions.browserURL;
  }

  if (launchOptions.browserURL) {
    delete launchOptions.browserWSEndpoint;
  }

  if (!isRemoteInstance) {
    launchOptions.args = [
      "--disable-setuid-sandbox",
      "--use-gl=egl",
      "--no-sandbox",
      `--remote-debugging-port=${config.debugport}`,
    ];
  }

  if (config.stealth) {
    launchOptions.args = [
      ...(launchOptions.args ?? []),
      "--disable-site-isolation-trials", // This should help with chrome
      "--no-cache",
      "--no-first-run",
      "--enable-features=NetworkService",
      "--profile-directory=Default",
      "--disable-blink-features",
      "--disable-setuid-sandbox",
      "--disable-infobars",
    ];

    node.status({
      fill: "blue",
      shape: "ring",
      text: "Launching Stealth Browswer",
    });

    puppeteerExtra.use(StealthPlugin());
    puppeteerExtra.use(UAPlugin());

    return await puppeteerExtra.connect(launchOptions);
  }

  node.status({
    fill: "grey",
    shape: "ring",
    text: "Launching Browswer",
  });
  return await puppeteer.connect(launchOptions);
};

const handleInput = async (
  node: PuppeteerNode,
  config: PuppeteerNodeConfig,
  message: PuppeteerMessageInFlow
) => {
  try {
    node.status({ fill: "green", shape: "dot", text: "Launching..." });

    const isDebugPortSet =
      config.debugport != undefined && config.debugport != 0;

    let browserUrl = config.browserUrl;

    if (isDebugPortSet) {
      browserUrl = `${config.browserUrl}:${config.debugport}`;
    }

    const launchOptions: LaunchOptions = {
      ...config,
      browserWSEndpoint: config.browserWSEndpoint,
      browserURL: browserUrl,
    };

    const isRemoteInstance = launchOptions.browserWSEndpoint !== undefined;

    const browser = await launchPuppeteer(launchOptions, node, config);

    const newPage = () => createPage(config.stealth, browser);

    if (isRemoteInstance) {
      node.status({
        fill: "grey",
        shape: "ring",
        text: "Attached to existing browser",
      });

      const pages = await message.puppeteer?.browser?.pages();

      let page = pages?.[0];

      if (!page) {
        page = await newPage();
      } else {
        await enableStealth(page);
      }

      if (config.stealth) {
        const isStealth = await checkStealth(page);

        if (!isStealth) {
          node.status({
            fill: "yellow",
            shape: "ring",
            text: "Stealth test failed",
          });
        }

        node.status({
          fill: "green",
          shape: "dot",
          text: "Stealth test passed",
        });
      }

      page.setDefaultTimeout(config.timeout ?? 30000);

      message.puppeteer = {
        browser,
        page,
        newPage,
      };
    } else {
      node.status({
        fill: "grey",
        shape: "ring",
        text: "Launched new browser",
      });

      const page = await newPage();
      page.setDefaultTimeout(config.timeout ?? 30000);

      message.puppeteer = {
        browser,
        page,
        newPage,
      };
    }

    node.send(message);
  } catch (err) {
    const error = err as Error;

    node.status({
      fill: "red",
      shape: "ring",
      text: error.message ?? error ?? "Error",
    });

    node.error(err);
  }
};

const handleClose = (node: PuppeteerNode) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerBrowserLaunch(
    this: PuppeteerNode,
    config: PuppeteerNodeConfig
  ) {
    RED.nodes.createNode(this, config);

    // set default config values

    config.defaultViewport = config.defaultViewport ?? null;
    config.ignoreHTTPSErrors = config.ignoreHTTPSErrors ?? true;
    config.timeout = config.timeout ?? 30000;
    config.headless = config.headless ?? true;
    config.devtools = config.devtools ?? false;
    config.stealth = config.stealth ?? false;

    this.slowMo = config.slowMo;
    this.debugport = config.debugport;

    this.stealth = config.stealth;
    this.browserUrl = config.browserUrl;
    this.defaultViewport = config.defaultViewport;
    this.ignoreHTTPSErrors = config.ignoreHTTPSErrors;
    this.browserWSEndpoint = config.browserWSEndpoint;

    this.timeout = config.timeout;
    this.headless = config.headless;
    this.devtools = config.devtools;

    // Retrieve the config node
    this.on("input", async (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(this));
  }

  RED.nodes.registerType("puppeteer-browser-launch", PuppeteerBrowserLaunch);
};
