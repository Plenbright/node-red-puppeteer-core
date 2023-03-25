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
      text: `Closing Tab...`,
    });

    if (message.puppeteer.page === undefined) {
      throw new Error("Page not found");
    }

    if (message.puppeteer.browser === undefined) {
      throw new Error("Browser not found");
    }

    await message.puppeteer.page.close();
    const pages = await message.puppeteer.browser.pages();
    if (pages.length > 0) {
      message.puppeteer.page = pages[0];
    } else {
      delete message.puppeteer.page;
    }

    node.status({ fill: "grey", shape: "ring", text: `Tab closed` });

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
  function PuppeteerPageClose(this: Node, config: PuppeteerNodeConfig) {
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
  RED.nodes.registerType("puppeteer-page-close", PuppeteerPageClose);
};
