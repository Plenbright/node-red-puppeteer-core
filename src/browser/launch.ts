import { NodeAPI } from "node-red";

import puppeteer, {
  ConnectOptions,
  Browser,
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
} from "puppeteer-core";

import {
  PuppeteerNode,
  PuppeteerNodeConfig,
  PuppeteerMessageInFlow,
} from "../types/PuppeteerConfigType";

type LaunchOptions = ConnectOptions &
  BrowserConnectOptions &
  BrowserLaunchArgumentOptions;

const launchPuppeteer = async (
  options: LaunchOptions,
  config: PuppeteerNodeConfig
): Promise<Browser> => {
  const isRemoteInstance = options.browserWSEndpoint !== undefined;

  const launchOptions: LaunchOptions = {
    ...options,
    headless: true,
    args: [],
  };

  if (!isRemoteInstance) {
    launchOptions.args = [
      "--disable-setuid-sandbox",
      "--use-gl=egl",
      "--no-sandbox",
      `--remote-debugging-port=${config.debugport}`,
    ];
  }

  const browser = await puppeteer.connect(launchOptions);
  return browser;
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

    const browser = await launchPuppeteer(launchOptions, config);

    if (isRemoteInstance) {
      node.status({
        fill: "grey",
        shape: "ring",
        text: "Attached to existing browser",
      });
    } else {
      node.status({
        fill: "grey",
        shape: "ring",
        text: "Launched new browser",
      });
    }

    message.puppeteer = {
      browser,
    };

    const pages = await message.puppeteer?.browser?.pages();

    let page = pages?.[0];

    if (!page) {
      page = await message.puppeteer?.browser?.newPage();
    }

    if (!page) {
      throw new Error("No page available");
    }

    page.setDefaultTimeout(config.timeout ?? 30000);

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

    this.slowMo = config.slowMo;
    this.debugport = config.debugport;

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
