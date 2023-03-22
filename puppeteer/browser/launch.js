const puppeteer = require("puppeteer");

module.exports = function (RED) {
  function PuppeteerBrowserLaunch(config) {
    RED.nodes.createNode(this, config);
    config.defaultViewport = null;
    config.ignoreHTTPSErrors = true;
    // Retrieve the config node
    this.on("input", async function (msg) {
      try {
        this.status({ fill: "green", shape: "dot", text: "Launching..." });
        if (config.debugport != 0) {
          try {
            const launchOptions = {
              ...config,
              browserWSEndpoint: config.websocketEndpoint,
              browserURL: config.browserUrl
                ? `${config.browserUrl}:${config.debugport}`
                : undefined,
            };

            msg.puppeteer = {
              browser: await puppeteer.connect(launchOptions),
            };

            this.status({
              fill: "grey",
              shape: "ring",
              text: "Attached to existing browser",
            });
          } catch (e) {
            this.status({
              fill: "green",
              shape: "dot",
              text: "No existing browser detected...",
            });

            const isRemoteInstance = config.browserWSEndpoint != undefined;

            const launchOptions = {
              ...config,
              browserWSEndpoint: config.websocketEndpoint,
            };

            if (!isRemoteInstance) {
              launchOptions = {
                ...launchOptions,
                browserURL: config.browserUrl
                  ? `${config.browserUrl}:${config.debugport}`
                  : undefined,
                headless: true,
                env: { DISPLAY: ":10" },
                args: [
                  "--disable-setuid-sandbox",
                  "--use-gl=egl",
                  "--no-sandbox",
                  `--remote-debugging-port=${config.debugport}`,
                ],
              };
            }

            msg.puppeteer = {
              browser: await puppeteer.launch(launchOptions),
            };

            this.status({ fill: "grey", shape: "ring", text: "Launched" });
          }
        }

        if (msg.puppeteer == undefined) {
          // TODO: Move instance check to a dedicated function

          const isRemoteInstance = config.browserWSEndpoint != undefined;

          const launchOptions = {
            ...config,
            browserWSEndpoint: config.websocketEndpoint,
          };

          if (!isRemoteInstance) {
            launchOptions = {
              ...launchOptions,
              browserURL: config.browserUrl
                ? `${config.browserUrl}:${config.debugport}`
                : undefined,
              headless: true,
              env: { DISPLAY: ":10" },
              args: [
                "--disable-setuid-sandbox",
                "--use-gl=egl",
                "--no-sandbox",
                `--remote-debugging-port=${config.debugport}`,
              ],
            };
          }

          msg.puppeteer = {
            browser: await puppeteer.launch(launchOptions),
          };
          this.status({ fill: "grey", shape: "ring", text: "Launched" });
        }
        msg.puppeteer.page = (await msg.puppeteer.browser.pages())[0];
        msg.puppeteer.page.setDefaultTimeout(config.timeout);
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
      $("#node-input-timeout").val(config.timeout);
      $("#node-input-slowMo").val(config.slowMo);
      $("#node-input-headless").val(config.headless);
      $("#node-input-debugport").val(config.debugport);
      $("#node-input-browserUrl").val(config.browserUrl);
      $("#node-input-browserWSEndpoint").val(config.browserWSEndpoint);
      $("#node-input-devtools").val(config.devtools);
      $("#node-input-name").val(config.name);
    }
  }
  RED.nodes.registerType("puppeteer-browser-launch", PuppeteerBrowserLaunch);
};
