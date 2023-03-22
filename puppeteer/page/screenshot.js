module.exports = function (RED) {
  function PuppeteerPageScreenshot(config) {
    RED.nodes.createNode(this, config);

    // Retrieve the config node
    this.on("input", async function (msg) {
      try {
        this.status({
          fill: "green",
          shape: "dot",
          text: `Capturing screen ...`,
        });
        msg.payload = await msg.puppeteer.page.screenshot({
          fullPage: config.fullpage,
        });
        this.status({ fill: "grey", shape: "ring", text: `Screen captured` });
        RED.comms.publish("puppeteer-screenshot", {
          id: this.id,
          image: msg.payload.toString("base64"),
        });
        this.send(msg);
      } catch (e) {
        this.status({ fill: "red", shape: "ring", text: e });
        this.error(e);
      }
    });
    this.on("close", function () {
      this.status({});
    });
    oneditprepare: function oneditprepare() {
      $("#node-input-name").val(this.name);
    }
  }
  RED.nodes.registerType("puppeteer-page-screenshot", PuppeteerPageScreenshot);
};
