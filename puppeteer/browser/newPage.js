module.exports = function (RED) {
  function PuppeteerBrowserNewPage (config) {
    RED.nodes.createNode(this, config)
    var node = this

    // Retrieve the config node
    this.on('input', async function (msg) {
      try {
        this.status({fill:"green",shape:"dot",text:`Opening new Tab...`});
        msg.puppeteer.page = await msg.puppeteer.browser.newPage()
        msg.puppeteer.page.setDefaultTimeout(config.timeout)
        this.status({fill:"grey",shape:"ring",text:`New Tab created`});
        node.send(msg) 
      } catch (e) {
        this.status({fill:"red",shape:"ring",text:e});
        node.error(e)
      }
    })
    this.on('close', function() {
      this.status({});
    });
    oneditprepare: function oneditprepare() {
      $("#node-input-name").val(this.name)
    }
  }
  RED.nodes.registerType('puppeteer-browser-newPage', PuppeteerBrowserNewPage)
}
