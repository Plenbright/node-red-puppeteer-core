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
    if (message.puppeteer.page === undefined) {
      throw new Error("Page not found");
    }

    const content = await message.puppeteer.page.content();

    message.puppeteer.content = content;

    node.send(message);
  } catch (err) {
    const error = err as Error;

    node.status({ fill: "red", shape: "ring", text: error.message ?? error });
    node.error(error);
  }
};

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageContent(this: Node, config: PuppeteerNodeConfig) {
    RED.nodes.createNode(this, config);
    var node = this;

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(node, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(node));
  }
  RED.nodes.registerType("puppeteer-page-content", PuppeteerPageContent);
};
