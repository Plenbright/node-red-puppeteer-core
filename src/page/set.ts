import { NodeAPI } from "node-red";

import {
  PuppeteerNode,
  PuppeteerNodeConfig,
  PuppeteerMessageInFlow,
} from "../types/PuppeteerConfigType";

const getValueFromObjectByPath = <
  T extends Record<keyof T, T[keyof T]>,
  K extends T[keyof T]
>(
  obj: T,
  path?: string
): K => {
  if (!path) {
    throw new Error("Path not found");
  }

  const value = path
    .split(".")
    .reduce((acc, part) => acc && acc[part as keyof T], obj) as T[keyof T];

  return value;
};

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

    let value = config.value;

    switch (config.valuetype) {
      case "str": {
        break;
      }

      case "msg": {
        const key = `${config.value}`.replace(/^msg\./, "");
        value = getValueFromObjectByPath<PuppeteerMessageInFlow, string>(
          message,
          key
        );
        break
      }

      default: {
        value = `${config.valuetype}.${config.value}`;
        break
      }
    }

    if (!value) {
      throw new Error("Value not found");
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

    node.status({
      fill: "green",
      shape: "dot",
      text: `Setting ${selector}:${value}`,
    });

    await message.puppeteer.page.$eval(
      selector,
      (el, value) => el.setAttribute("value", value as string),
      value
    );

    node.status({
      fill: "grey",
      shape: "ring",
      text: `${selector}:${value}`,
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
  function PuppeteerPageSetValue(
    this: PuppeteerNode,
    config: PuppeteerNodeConfig
  ) {
    RED.nodes.createNode(this, config);

    this.selector = config.selector;
    this.selectortype = config.selectortype;
    this.value = config.value;
    this.valuetype = config.valuetype;

    // Retrieve the config node
    this.on("input", (message) =>
      handleInput(this, config, message as PuppeteerMessageInFlow)
    );

    this.on("close", () => handleClose(this));
  }

  RED.nodes.registerType("puppeteer-page-set-value", PuppeteerPageSetValue);
};
