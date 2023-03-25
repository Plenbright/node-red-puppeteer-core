import { NodeAPI, Node } from "node-red";

import {
  PuppeteerNodeConfig,
  PuppeteerMessageInFlow,
} from "../types/PuppeteerConfigType";

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

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageClick(this: Node, config: PuppeteerNodeConfig) {
    RED.nodes.createNode(this, config);
    // Retrieve the config node
    config.clickCount = parseInt(Number(config.clickCount).toString() || "0");
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );
    this.on("close", () => handleClose(this));

    // oneditprepare: function oneditprepare() {
    //   $("#node-input-clickCount").val(config.clickCount);
    //   $("#node-input-delay").val(config.delay);
    //   $("#node-input-button").val(config.button);
    //   $("#node-input-name").val(config.name);
    // }
  }
  RED.nodes.registerType("puppeteer-page-click", PuppeteerPageClick);
};
