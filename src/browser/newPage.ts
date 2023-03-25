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
    node.status({
      fill: "green",
      shape: "dot",
      text: `Opening new Tab...`,
    });

    if (message.puppeteer.browser === undefined) {
      throw new Error("Browser not found");
    }

    message.puppeteer.page = await message.puppeteer.browser.newPage();
    message.puppeteer.page.setDefaultTimeout(config.timeout ?? 30000);

    node.status({ fill: "grey", shape: "ring", text: `New Tab created` });
    node.send(message);
  } catch (err) {
    const error = err as Error;

    node.status({
      fill: "red",
      shape: "ring",
      text: error.message ?? error,
    });
    node.error(err);
  }
};

const handleClose = (node: Node) => node.close(true);

module.exports = (RED: NodeAPI) => {
  function PuppeteerBrowserNewPage(this: Node, config: PuppeteerNodeConfig) {
    RED.nodes.createNode(this, config);
    var node = this;

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(node, config, message as PuppeteerMessageInFlow)
    );
    this.on("close", () => handleClose(node));
  }
  RED.nodes.registerType("puppeteer-browser-newPage", PuppeteerBrowserNewPage);
};
