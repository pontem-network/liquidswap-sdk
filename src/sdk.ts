import {AptosClient} from "aptos";
import {SwapModule} from "./modules/SwapModule";
import {ResourcesModule} from "./modules/ResourcesModule";
import {AptosResourceType} from "./types/aptos";

export type SdkOptions = {
  nodeUrl: string,
  networkOptions: {
    nativeToken: AptosResourceType,
    modules: {
      CoinInfo: AptosResourceType,
      CoinStore: AptosResourceType,
      Scripts: AptosResourceType,
    } & Record<string, AptosResourceType>,
  }
}

export class SDK {
  protected _client: AptosClient;
  protected _swap: SwapModule;
  protected _resources: ResourcesModule;
  protected _networkOptions: SdkOptions["networkOptions"];

  get Swap() {
    return this._swap;
  }

  get Resources() {
    return this._resources;
  }

  get client() {
    return this._client;
  }

  get networkOptions() {
    return this._networkOptions;
  }

  constructor(options: SdkOptions) {
    this._networkOptions = options.networkOptions;
    this._client = new AptosClient(options.nodeUrl);
    this._swap = new SwapModule(this);
    this._resources = new ResourcesModule(this);
  }
}
