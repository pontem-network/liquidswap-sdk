import { AptosClient } from 'aptos';
import { SwapModule } from './modules/SwapModule';
import { ResourcesModule } from './modules/ResourcesModule';
import { AptosResourceType } from './types/aptos';
import { LiquidityModule } from './modules/LiquidityModule';
import { NETWORKS_MODULES, MODULES_ACCOUNT, RESOURCES_ACCOUNT } from './constants';

const initialNetworkOptions = {
  nativeToken: '0x1::aptos_coin::AptosCoin',
  modules: {
    Scripts: NETWORKS_MODULES.Scripts,
    CoinInfo: NETWORKS_MODULES.CoinInfo,
    CoinStore: NETWORKS_MODULES.CoinStore,
  },
  resourceAccount: RESOURCES_ACCOUNT,
  moduleAccount: MODULES_ACCOUNT,
};

interface INetworkOptions {
  nativeToken?: AptosResourceType;
  modules?: {
    CoinInfo: AptosResourceType;
    CoinStore: AptosResourceType;
    Scripts: AptosResourceType;
  } & Record<string, AptosResourceType>;
  resourceAccount?: string;
  moduleAccount?: string;
}

export interface SdkOptions {
  nodeUrl: string;
  networkOptions?: INetworkOptions;
}

interface ICurves {
  stable: string;
  uncorrelated: string;
}

export class SDK {
  protected _client: AptosClient;
  protected _swap: SwapModule;
  protected _liquidity: LiquidityModule;
  protected _resources: ResourcesModule;
  protected _networkOptions: Required<INetworkOptions>;
  protected _curves: ICurves;

  get Swap() {
    return this._swap;
  }

  get Resources() {
    return this._resources;
  }

  get Liquidity() {
    return this._liquidity;
  }

  get client() {
    return this._client;
  }

  get networkOptions() {
    return this._networkOptions;
  }

  get curves() {
    return this._curves;
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
      if (options.networkOptions?.moduleAccount) {
        this._networkOptions.moduleAccount = options.networkOptions.moduleAccount;
      }
      if (options.networkOptions?.resourceAccount) {
        this._networkOptions.resourceAccount = options.networkOptions.resourceAccount;
      }
    }
    this._client = new AptosClient(options.nodeUrl);
    this._swap = new SwapModule(this);
    this._resources = new ResourcesModule(this);
    this._liquidity = new LiquidityModule(this);
    this._curves = {
      uncorrelated: `${this._networkOptions.moduleAccount}::curves::Uncorrelated`,
      stable: `${this._networkOptions.moduleAccount}::curves::Stable`
    }
  }
}
