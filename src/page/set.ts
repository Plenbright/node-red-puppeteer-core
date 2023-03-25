import { NodeAPI, Node } from "node-red";

import {
  PuppeteerNodeConfig,
  PuppeteerMessageInFlow,
} from "../types/PuppeteerConfigType";

const waitForCondition = async (
  callback: () => Promise<boolean>
): Promise<void> => {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const result = await callback();

      if (result) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
};

const handleInput = async (
  node: Node,
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

    let value = config.value;

    if (config.valuetype != "str") {
      value = `${config.valuetype}.${config.value}`;
    }

    if (!value) {
      throw new Error("Value not found");
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

    node.status({
      fill: "green",
      shape: "dot",
      text: `Setting ${selector}:${value}`,
    });

    await waitForCondition(async () => {
      if (message.puppeteer.page === undefined) {
        throw new Error("Page not found");
      }

      if (!selector) {
        throw new Error("Selector not found");
      }

      const result = await message.puppeteer.page.$eval(selector, (el) =>
        el.getAttribute("value")
      );

      await message.puppeteer.page.$eval(
        selector,
        // i really dont like this any but i'm not sure how to fix it
        (el, value) => el.setAttribute("value", value as any),
        value
      );

      return result === value;
    });

    node.status({
      fill: "grey",
      shape: "ring",
      text: `${selector}:${value}`,
    });

    node.send(message);
  } catch (err) {
    const error = err as Error;
    node.status({ fill: "red", shape: "ring", text: error.message ?? error });
    node.error(error);
  }
};

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageSetValue(this: Node, config: PuppeteerNodeConfig) {
    RED.nodes.createNode(this, config);

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(this));
    // oneditprepare: function oneditprepare() {
    //   $("#node-input-name").val(this.name);
    // }
  }
  RED.nodes.registerType("puppeteer-page-set-value", PuppeteerPageSetValue);
};
