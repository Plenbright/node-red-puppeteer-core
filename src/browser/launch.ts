import { NodeAPI, Node } from "node-red";
import puppeteer, {
  ConnectOptions,
  Browser,
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
} from "puppeteer-core";

import {
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
  node: Node,
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
      browserWSEndpoint: config.websocketEndpoint,
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

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerBrowserLaunch(this: Node, config: PuppeteerNodeConfig) {
    RED.nodes.createNode(this, config);

    config.defaultViewport = null;
    config.ignoreHTTPSErrors = true;
    // Retrieve the config node
    this.on("input", async (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(this));

    // oneditprepare: function oneditprepare() {
    //   $("#node-input-timeout").val(config.timeout);
    //   $("#node-input-slowMo").val(config.slowMo);
    //   $("#node-input-headless").val(config.headless);
    //   $("#node-input-debugport").val(config.debugport);
    //   $("#node-input-browserUrl").val(config.browserUrl);
    //   $("#node-input-browserWSEndpoint").val(config.browserWSEndpoint);
    //   $("#node-input-devtools").val(config.devtools);
    //   $("#node-input-name").val(config.name);
    // }
  }

  RED.nodes.registerType("puppeteer-browser-launch", PuppeteerBrowserLaunch);
};
