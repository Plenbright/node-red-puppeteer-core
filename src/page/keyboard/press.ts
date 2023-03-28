import { NodeAPI } from "node-red";

import {
  PuppeteerNode,
  PuppeteerNodeConfig,
  PuppeteerMessageInFlow,
} from "../../types/PuppeteerConfigType";

const handleInput = async (
  node: PuppeteerNode,
  config: PuppeteerNodeConfig,
  message: PuppeteerMessageInFlow
) => {
  try {
    node.status({
      fill: "green",
      shape: "dot",
      text: `Pressing Key ${config.key}`,
    });

    if (message.puppeteer.page === undefined) {
      throw new Error("Page not found");
    }

    if (!config.key) {
      throw new Error("Key not found");
    }

    await message.puppeteer.page.keyboard.press(config.key);

    node.status({
      fill: "grey",
      shape: "ring",
      text: `Pressed Key ${config.key}`,
    });

    node.send(message);
  } catch (err) {
    const error = err as Error;

    node.status({ fill: "red", shape: "ring", text: error.message ?? error });
    node.error(error);
  }
};

const handleClose = (node: PuppeteerNode) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageKeyboardPress(
    this: PuppeteerNode,
    config: PuppeteerNodeConfig
  ) {
    RED.nodes.createNode(this, config);

    this.key = config.key;
    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(this));
  }
  RED.nodes.registerType(
    "puppeteer-page-keyboard-press",
    PuppeteerPageKeyboardPress
  );
};
