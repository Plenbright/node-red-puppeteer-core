module.exports = function (RED) {
  function PuppeteerPageClose(config) {
    RED.nodes.createNode(this, config);

    // Retrieve the config node
    this.on("input", async function (msg) {
      try {
        this.status({ fill: "green", shape: "dot", text: `Closing Tab...` });
        await msg.puppeteer.page.close();
        msg.puppeteer.page = (await msg.puppeteer.browser.pages())[0];
        this.status({ fill: "grey", shape: "ring", text: `Tab closed` });
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
  RED.nodes.registerType("puppeteer-page-close", PuppeteerPageClose);
};
