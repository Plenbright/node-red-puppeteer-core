import { NodeDef, NodeMessageInFlow, Node } from "node-red";
import {
  Page,
  Browser,
  Viewport,
  MouseButton,
  Protocol,
  KeyInput,
  PuppeteerLifeCycleEvent,
} from "puppeteer-core";

type PuppeteerInitConfiguration = {
  slowMo?: number;
  headless?: boolean;
  devtools?: boolean;
  timeout?: number;
  ignoreHTTPSErrors?: boolean;
  browserUrl?: string;
  browserWSEndpoint: string;
  defaultViewport?: Viewport | null;
  debugport?: number;
};

type PuppeteerPageConfiguration = {
  fullpage?: boolean;
  waitUntil?: PuppeteerLifeCycleEvent;

  clickCount?: number | string;
  delay: number;
  button: MouseButton;

  key?: KeyInput;

  text?: string;
  texttype?: "str" | "msg" | "flow" | "global";

  url?: string;
  urltype?: "str" | "msg" | "flow" | "global";

  selector?: string;
  selectortype?: "str" | "msg" | "flow" | "global";

  property?: string;
  propertytype?: "str" | "innerText" | "innerHTML" | "outerHTML";

  value?: string;
  valuetype?: "str" | "msg" | "flow" | "global";

  file?: string;
  filetype?: "str" | "msg" | "flow" | "global";
};

export type PuppeteerNode = Node &
  PuppeteerInitConfiguration &
  PuppeteerPageConfiguration;

export type PuppeteerNodeConfig = NodeDef &
  PuppeteerInitConfiguration &
  PuppeteerPageConfiguration;

export type PuppeteerMessageInFlow = NodeMessageInFlow & {
  headers?: Protocol.Network.GetAllCookiesResponse;
  payload: any;
  puppeteer: {
    page?: Page;
    browser?: Browser;
    content?: string;
  };
};
