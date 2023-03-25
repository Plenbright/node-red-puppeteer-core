import { NodeAPI, Node } from "node-red";

import {
  PuppeteerNodeConfig,
  PuppeteerMessageInFlow,
} from "../../types/PuppeteerConfigType";

const handleInput = async (
  node: Node,
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

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageKeyboardPress(this: Node, config: PuppeteerNodeConfig) {
    RED.nodes.createNode(this, config);

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(this));

    // oneditprepare: function oneditprepare() {
    //   $("#node-input-name").val(this.name);
    //   $("#node-input-key").val(this.key);
    // }
  }
  RED.nodes.registerType(
    "puppeteer-page-keyboard-press",
    PuppeteerPageKeyboardPress
  );
};
