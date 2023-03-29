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

    let property = config.property;

    if (config.propertytype != "str") {
      property = `${config.propertytype}.${config.property}`;
    }

    if (!property) {
      throw new Error("Property not found");
    }

    node.status({
      fill: "green",
      shape: "dot",
      text: `Wait for ${selector}`,
    });

    if (message.puppeteer.page === undefined) {
      throw new Error("Page not found");
    }

    await message.puppeteer.page.content()

    await message.puppeteer.page.waitForSelector(selector, {
      timeout: config.timeout,
    });

    node.status({
      fill: "green",
      shape: "dot",
      text: `Getting ${selector}`,
    });

    const value = await message.puppeteer.page.$eval(
      selector,
      (el, property) => el[property as keyof Element],
      property
    );

    node.status({ fill: "grey", shape: "ring", text: `${value}` });
    message.payload = value;

    node.send(message);
  } catch (err) {
    const error = err as Error;
    node.status({ fill: "red", shape: "ring", text: error.message ?? error });
    node.error(error);
  }
};

const handleClose = (node: PuppeteerNode) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageGetValue(
    this: PuppeteerNode,
    config: PuppeteerNodeConfig
  ) {
    RED.nodes.createNode(this, config);

    this.timeout = config.timeout;
    this.selector = config.selector;
    this.selectortype = config.selectortype;
    this.property = config.property;
    this.propertytype = config.propertytype;

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(this));
  }
  RED.nodes.registerType("puppeteer-page-get-value", PuppeteerPageGetValue);
};
