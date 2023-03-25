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

    const uploadSelector = await message.puppeteer.page.$(selector) as any; 

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

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageUpload(this: Node, config: PuppeteerNodeConfig) {
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
  RED.nodes.registerType("puppeteer-page-upload", PuppeteerPageUpload);
};
