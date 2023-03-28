import { NodeAPI } from "node-red";

import {
  PuppeteerNode,
  PuppeteerNodeConfig,
  PuppeteerMessageInFlow,
} from "../types/PuppeteerConfigType";

const handleInput = async (
  node: PuppeteerNode,
  config: PuppeteerNodeConfig,
  message: PuppeteerMessageInFlow
) => {
  try {
    let selector = config.selector;

    if (config.selectortype != "str") {
      selector = `${config.selectortype}.${config.selector}`;
    }

    if (!selector) {
      throw new Error("Selector not found");
    }

    node.status({
      fill: "green",
      shape: "dot",
      text: `Wait for ${selector}`,
    });

    if (message.puppeteer.page === undefined) {
      throw new Error("Page not found");
    }

    await message.puppeteer.page.waitForSelector(selector);

    node.status({ fill: "green", shape: "dot", text: `Click ${selector}` });

    await message.puppeteer.page.click(selector, {
      delay: config.delay,
      button: config.button,
      clickCount: config.clickCount as number,
    });

    node.status({
      fill: "grey",
      shape: "ring",
      text: `Clicked ${selector}`,
    });

    node.send(message);
  } catch (err) {
    const error = err as Error;

    node.status({ fill: "red", shape: "ring", text: error.message ?? error });
    node.error(error);
  }
};

const handleClose = (node: PuppeteerNode) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageClick(
    this: PuppeteerNode,
    config: PuppeteerNodeConfig
  ) {
    RED.nodes.createNode(this, config);
    // Retrieve the config node
    config.clickCount = parseInt(Number(config.clickCount).toString() || "0");

    this.clickCount = config.clickCount;
    this.delay = config.delay;
    this.button = config.button;
    this.name = config.name;
    this.selectortype = config.selectortype;
    this.selector = config.selector;

    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );
    this.on("close", () => handleClose(this));
  }
  RED.nodes.registerType("puppeteer-page-click", PuppeteerPageClick);
};
