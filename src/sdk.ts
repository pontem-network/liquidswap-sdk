import {AptosClient} from "aptos";
import {SwapModule} from "./modules/SwapModule";
import {ResourcesModule} from "./modules/ResourcesModule";
import {AptosResourceType} from "./types/aptos";

const initialNetworkOptions = {
  nativeToken: '0x1::aptos_coin::AptosCoin',
  modules: {
    Scripts: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2',
    CoinInfo: '0x1::coin::CoinInfo',
    CoinStore: '0x1::coin::CoinStore',
  },
}

interface INetworkOptions {
  nativeToken?: AptosResourceType;
  modules?: {
    CoinInfo: AptosResourceType;
    CoinStore: AptosResourceType;
    Scripts: AptosResourceType;
  } & Record<string, AptosResourceType>
}

export interface SdkOptions {
  nodeUrl: string;
  networkOptions?: INetworkOptions;
}


export class SDK {
  protected _client: AptosClient;
  protected _swap: SwapModule;
  protected _resources: ResourcesModule;
  protected _networkOptions: Required<INetworkOptions>;

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
    this._networkOptions = initialNetworkOptions;
    if (options.networkOptions) {
      if (options.networkOptions?.nativeToken) {
        this._networkOptions.nativeToken = options.networkOptions.nativeToken;
      }
      if (options.networkOptions?.modules) {
        this._networkOptions.modules = options.networkOptions.modules;
      }
    }
    this._client = new AptosClient(options.nodeUrl);
    this._swap = new SwapModule(this);
    this._resources = new ResourcesModule(this);
  }
}
