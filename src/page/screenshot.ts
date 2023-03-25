import { NodeAPI, Node } from "node-red";

import {
  PuppeteerNodeConfig,
  PuppeteerMessageInFlow,
} from "../types/PuppeteerConfigType";

const handleInput = async (
  node: Node,
  config: PuppeteerNodeConfig,
  message: PuppeteerMessageInFlow,
  RED: NodeAPI
) => {
  try {
    node.status({
      fill: "green",
      shape: "dot",
      text: `Capturing screen ...`,
    });

    if (message.puppeteer.page === undefined) {
      throw new Error("Page not found");
    }

    message.payload = await message.puppeteer.page.screenshot({
      fullPage: config.fullpage,
    });

    node.status({ fill: "grey", shape: "ring", text: `Screen captured` });

    RED.comms.publish(
      "puppeteer-screenshot",
      {
        id: node.id,
        image: message.payload.toString("base64"),
      },
      false
    );

    node.send(message);
  } catch (err) {
    const error = err as Error;

    node.status({ fill: "red", shape: "ring", text: error.message ?? error });
    node.error(error);
  }
};

const handleClose = (node: Node) => node.status({});

module.exports = function (RED: NodeAPI) {
  function PuppeteerPageScreenshot(this: Node, config: PuppeteerNodeConfig) {
    RED.nodes.createNode(this, config);

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow, RED)
    );
    this.on("close", () => handleClose(this));
    // oneditprepare: function oneditprepare() {
    //   $("#node-input-name").val(this.name);
    // }
  }
  RED.nodes.registerType("puppeteer-page-screenshot", PuppeteerPageScreenshot);
};
