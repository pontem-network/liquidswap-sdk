import { AptosClient, ClientConfig } from 'aptos';
import { SwapModule } from './modules/SwapModule';
import { ResourcesModule } from './modules/ResourcesModule';
import { AptosResourceType } from './types/aptos';
import { LiquidityModule } from './modules/LiquidityModule';
import {
  NETWORKS_MODULES,
  MODULES_ACCOUNT,
  RESOURCES_ACCOUNT,
  MODULES_V05_ACCOUNT,
  RESOURCES_V05_ACCOUNT,
} from './constants';

const initialNetworkOptions = {
  nativeToken: '0x1::aptos_coin::AptosCoin',
  modules: {
    Scripts: NETWORKS_MODULES.Scripts,
    CoinInfo: NETWORKS_MODULES.CoinInfo,
    CoinStore: NETWORKS_MODULES.CoinStore,
  },
  resourceAccount: RESOURCES_ACCOUNT,
  moduleAccount: MODULES_ACCOUNT,
  moduleAccountV05: MODULES_V05_ACCOUNT,
  resourceAccountV05: RESOURCES_V05_ACCOUNT,
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
  moduleAccountV05?: string;
  resourceAccountV05?: string;
}

export interface SdkOptions {
  nodeUrl: string;
  nodeOptions?: Partial<ClientConfig>;
  networkOptions?: INetworkOptions;
}

export interface ICurves {
  stable: string;
  uncorrelated: string;
  stableV05: string;
  uncorrelatedV05: string;
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
        this._networkOptions.moduleAccount =
          options.networkOptions.moduleAccount;
      }
      if (options.networkOptions?.resourceAccount) {
        this._networkOptions.resourceAccount =
          options.networkOptions.resourceAccount;
      }
      if (options.networkOptions?.moduleAccountV05) {
        this._networkOptions.moduleAccountV05 =
          options.networkOptions.moduleAccountV05;
      }
      if (options.networkOptions?.resourceAccountV05) {
        this._networkOptions.resourceAccountV05 =
          options.networkOptions.resourceAccountV05;
      }
    }
    this._client = new AptosClient(options.nodeUrl, options.nodeOptions);
    this._swap = new SwapModule(this);
    this._resources = new ResourcesModule(this);
    this._liquidity = new LiquidityModule(this);
    this._curves = {
      uncorrelated: `${this._networkOptions.moduleAccount}::curves::Uncorrelated`,
      stable: `${this._networkOptions.moduleAccount}::curves::Stable`,
      uncorrelatedV05: `${this._networkOptions.moduleAccountV05}::curves::Uncorrelated`,
      stableV05: `${this._networkOptions.moduleAccountV05}::curves::Stable`,
    };
  }
}
