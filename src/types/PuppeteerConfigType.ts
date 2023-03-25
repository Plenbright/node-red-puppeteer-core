import { NodeDef, NodeMessageInFlow } from "node-red";
import {
  Page,
  Browser,
  Viewport,
  MouseButton,
  Protocol,
  KeyInput,
} from "puppeteer-core";

export type PuppeteerNodeConfig = NodeDef & {
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

  fullpage?: boolean;

  delay: number;
  button: MouseButton;
  clickCount?: number | string;
  debugport?: number;
  timeout?: number;
  ignoreHTTPSErrors?: boolean;
  browserUrl?: string;
  websocketEndpoint: string;
  defaultViewport?: Viewport | null;
};

export type PuppeteerMessageInFlow = NodeMessageInFlow & {
  headers?: Protocol.Network.GetAllCookiesResponse;
  payload: any;
  puppeteer: {
    page?: Page;
    browser?: Browser;
    content?: string;
  };
};
