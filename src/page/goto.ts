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
    let url = config.url;

    if (config.urltype != "str") {
      url = `${config.urltype}.${config.url}`;
    }

    if (!url) {
      throw new Error("URL not found");
    }

    node.status({ fill: "green", shape: "dot", text: `Go to ${url}` });

    if (message.puppeteer.page === undefined) {
      throw new Error("Page not found");
    }

    await message.puppeteer.page.goto(url, config);

    const pageClient = await message.puppeteer.page.target().createCDPSession();

    message["headers"] = await pageClient.send("Network.getAllCookies");

    node.status({ fill: "grey", shape: "ring", text: url });

    node.send(message);
  } catch (err) {
    const error = err as Error;
    node.status({ fill: "red", shape: "ring", text: error.message ?? error });
    node.error(error);
  }
};

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerPageGoto(this: Node, config: PuppeteerNodeConfig) {
    RED.nodes.createNode(this, config);

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(this));

    // oneditprepare: function oneditprepare() {
    //   $("#node-input-name").val(this.name);
    //   $("#node-input-waitUntil").val(this.waitUntil);
    // }
  }
  RED.nodes.registerType("puppeteer-page-goto", PuppeteerPageGoto);
};
