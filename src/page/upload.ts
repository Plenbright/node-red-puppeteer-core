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

    let file = config.file;

    if (config.filetype != "str") {
      file = `${config.filetype}.${config.file}`;
    }

    if (!file) {
      throw new Error("File not found");
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

    node.status({ fill: "green", shape: "dot", text: `Upload ${file}` });

    const uploadSelector = (await message.puppeteer.page.$(selector)) as any;

    if (uploadSelector === null) {
      throw new Error("Upload selector not found");
    }

    await uploadSelector.uploadFile(file);

    node.status({ fill: "grey", shape: "ring", text: `Uploaded ${file}` });

    node.send(message);
  } catch (err) {
    const error = err as Error;

    node.status({ fill: "red", shape: "ring", text: error.message ?? error });
    node.error(error);
  }
};

const handleClose = (node: PuppeteerNode) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageUpload(
    this: PuppeteerNode,
    config: PuppeteerNodeConfig
  ) {
    RED.nodes.createNode(this, config);

    this.name = config.name;
    this.file = config.file;
    this.filetype = config.filetype;

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );
    this.on("close", () => handleClose(this));
  }

  RED.nodes.registerType("puppeteer-page-upload", PuppeteerPageUpload);
};
