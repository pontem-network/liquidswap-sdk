import {AptosClient} from "aptos";
import {SwapModule} from "./modules/SwapModule";
import {ResourcesModule} from "./modules/ResourcesModule";
import {AptosResourceType} from "./types/aptos";

export type NetworkOptions = {
  nativeToken: AptosResourceType,
  modules: {
    LiquidswapDeployer: string,
    CoinInfo: AptosResourceType,
    CoinStore: AptosResourceType,
  } & Record<string, AptosResourceType>,
}

export type SdkOptions = {
  nodeUrl: string,
  networkOptions: NetworkOptions,
}

const defaultNetworkOptions: NetworkOptions = {
  nativeToken: '0x1::test_coin::TestCoin',
  modules: {
    LiquidswapDeployer: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9', // This address of liquidswap contracts deployer.
    CoinInfo: '0x1::coin::CoinInfo', // Type of base CoinInfo module.
    CoinStore: '0x1::coin::CoinStore', // Type of base CoinStore module.
  },
};

const defaultSdkOptions: SdkOptions = {
  nodeUrl: 'https://fullnode.devnet.aptoslabs.com',
  networkOptions: defaultNetworkOptions,
};

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

  constructor(options: SdkOptions=defaultSdkOptions) {
    this._networkOptions = options.networkOptions;
    this._client = new AptosClient(options.nodeUrl);
    this._swap = new SwapModule(this);
    this._resources = new ResourcesModule(this);
  }
}
