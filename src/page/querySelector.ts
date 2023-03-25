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
    let selector = config.selector ?? "a";
    const property = config.property ?? "innerText";

    if (!config.selector) {
      throw new Error("Selector not found");
    }

    switch (config.selectortype) {
      case "msg": {
        selector = message[config.selector as keyof PuppeteerMessageInFlow];
        break;
      }

      case "flow": {
        selector = node.context().flow.get(config.selector) as string;
        break;
      }

      case "global": {
        selector = node.context().global.get(config.selector) as string;
      }
    }

    if (message.puppeteer.page === undefined) {
      throw new Error("Page not found");
    }

    if (!selector) {
      throw new Error("Selector not found");
    }

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

const handleClose = (node: Node) => node.status({});

module.exports = (RED: NodeAPI) => {
  function PuppeteerDocumentQuerySelector(
    this: Node,
    config: PuppeteerNodeConfig
  ) {
    RED.nodes.createNode(this, config);

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(this));

    // oneditprepare: function oneditprepare() {
    //   $("#node-input-name").val(this.name);
    //   $("#node-input-selector").val(this.selector);
    //   $("#node-input-property").val(this.property);
    // }
  }

  RED.nodes.registerType(
    "puppeteer-page-document-querySelector",
    PuppeteerDocumentQuerySelector
  );
};
