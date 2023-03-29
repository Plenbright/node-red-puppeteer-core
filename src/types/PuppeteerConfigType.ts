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

export type PuppeteerInitConfiguration = {
  slowMo?: number;
  headless?: boolean;
  devtools?: boolean;
  timeout?: number;
  ignoreHTTPSErrors?: boolean;
  browserUrl?: string;
  browserWSEndpoint?: string;
  defaultViewport?: Viewport | null;
  debugport?: number;
};

export type RedItemType = "str" | "msg" | "flow" | "global";

export type PuppeteerPageConfiguration = {
  fullpage?: boolean;
  waitUntil?: PuppeteerLifeCycleEvent;

  clickCount?: number | string;

  delay: number;
  button: MouseButton;

  key?: KeyInput;

  text?: string;
  texttype?: RedItemType;

  url?: string;
  urltype?: RedItemType;

  selector?: string;
  selectortype?: RedItemType;

  property?: string;
  propertytype?: RedItemType;

  value?: string;
  valuetype?: RedItemType;

  file?: string;
  filetype?: RedItemType;
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
