import { NodeAPI, Node } from "node-red";

import {
  PuppeteerNodeConfig,
  PuppeteerMessageInFlow,
} from "../types/PuppeteerConfigType";

const handleInput = async (
  node: Node,
  _config: PuppeteerNodeConfig,
  message: PuppeteerMessageInFlow
) => {
  try {
    node.status({
      fill: "green",
      shape: "dot",
      text: `Closing browser...`,
    });

    if (message.puppeteer.browser === undefined) {
      throw new Error("Browser not found");
    }

    await message.puppeteer.browser.close();
    node.status({ fill: "grey", shape: "ring", text: `Browser closed` });

    delete message.puppeteer.page;
    delete message.puppeteer.browser;

    node.send(message);
  } catch (err) {
    const error = err as Error;

    node.status({
      fill: "red",
      shape: "ring",
      text: error.message ?? error,
    });

    node.error(error);
  }
};

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerBrowserClose(this: Node, config: PuppeteerNodeConfig) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    var node = this;

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(node, config, message as PuppeteerMessageInFlow)
    );
    this.on("close", () => handleClose(node));
  }
  RED.nodes.registerType("puppeteer-browser-close", PuppeteerBrowserClose);
};
