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

    switch (config.selectortype) {
      case "msg": {
        if (config.selector) {
          selector = message[config.selector];
        }
        break;
      }

      case "flow": {
        if (config.selector) {
          const value = node.context().flow.get(config.selector);

          if (value) {
            selector = String(value);
          }
        }
        break;
      }

      case "global": {
        if (config.selector) {
          const value = node.context().global.get(config.selector);

          if (value) {
            selector = String(value);
          }
        }

        break;
      }
    }

    if (!selector) {
      // Default to a
      selector = "a";
    }

    if (message.puppeteer.page === undefined) {
      throw new Error("Page not found");
    }

    const property = config.property ?? "innerText";

    const payload = await message.puppeteer.page.evaluate(
      ({ selector, property }) => {
        const element = document.querySelector(selector as string);

        if (!element) {
          return null;
        }

        return element[property as keyof Element];
      },
      {
        selector,
        property,
      }
    );

    message.payload = payload;
    node.send(message);
  } catch (err) {
    const error = err as Error;
    node.status({ fill: "red", shape: "ring", text: error.message ?? error });
    node.error(error);
  }
};

const handleClose = (node: PuppeteerNode) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerDocumentQuerySelector(
    this: PuppeteerNode,
    config: PuppeteerNodeConfig
  ) {
    RED.nodes.createNode(this, config);

    this.name = config.name;
    this.selector = config.selector;
    this.property = config.property;

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(this));
  }

  RED.nodes.registerType(
    "puppeteer-page-document-querySelector",
    PuppeteerDocumentQuerySelector
  );
};
