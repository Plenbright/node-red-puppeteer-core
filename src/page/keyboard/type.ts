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
    let text = config.text;

    switch (config.texttype) {
      case "msg": {
        text = message[config.text as keyof PuppeteerMessageInFlow];
        break;
      }

      case "flow": {
        if (config.text) {
          const value = node.context().flow.get(config.text);

          if (value) {
            text = String(value);
          }
        }

        break;
      }

      case "global": {
        if (config.text) {
          const value = node.context().global.get(config.text);

          if (value) {
            text = String(value);
          }
        }

        break;
      }
    }

    if (!text) {
      throw new Error("Text not found");
    }

    node.status({ fill: "green", shape: "dot", text: `Typing ${text}` });

    if (message.puppeteer.page === undefined) {
      throw new Error("Page not found");
    }

    await message.puppeteer.page.keyboard.type(text);

    node.status({ fill: "grey", shape: "ring", text: `Typed ${text}` });

    node.send(message);
  } catch (err) {
    const error = err as Error;
    node.status({ fill: "red", shape: "ring", text: error.message ?? error });
    node.error(error);
  }
};

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageKeyboardType(this: Node, config: PuppeteerNodeConfig) {
    RED.nodes.createNode(this, config);

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );
    this.on("close", () => handleClose(this));
  }
  RED.nodes.registerType(
    "puppeteer-page-keyboard-type",
    PuppeteerPageKeyboardType
  );
};
