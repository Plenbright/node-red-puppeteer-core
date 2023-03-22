const puppeteer = require('puppeteer')


module.exports = function (RED) {
  function PuppeteerBrowserClose (config) {
    RED.nodes.createNode(this, config)
    this.name = config.name
    var node = this

    // Retrieve the config node
    this.on('input', async function (msg) {
      try {
        this.status({fill:"green",shape:"dot",text:`Closing browser...`});
        await msg.puppeteer.browser.close()
        this.status({fill:"grey",shape:"ring",text:`Browser closed`});
        delete msg.puppeteer
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
  RED.nodes.registerType('puppeteer-browser-close', PuppeteerBrowserClose)
}
