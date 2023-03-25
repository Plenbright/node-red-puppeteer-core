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

    await message.puppeteer.page.waitForSelector(selector);

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

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageGetValue(this: Node, config: PuppeteerNodeConfig) {
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
  RED.nodes.registerType("puppeteer-page-get-value", PuppeteerPageGetValue);
};
