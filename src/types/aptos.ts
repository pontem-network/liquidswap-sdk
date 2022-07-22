export type AptosResourceType = string;

export type AptosResource<T = unknown> = {
  data: T,
  type: string,
}

export type AptosCoinInfoResource = {
  decimals: string;
  name: string;
  supply: {
    vec: [string];
  };
  symbol: string;
};

export type AptosPoolResource = {
  coin_x_reserve: { value: string };
  coin_y_reserve: { value: string };
  last_block_timestamp: string;
  last_price_x_cumulative: string;
  last_price_y_cumulative: string;
  lp_burn_cap: {
    dummy_field: boolean;
  };
  lp_mint_cap: {
    dummy_field: boolean;
  };
};

export type TxPayloadCallFunction = {
  type: 'script_function_payload';
  function: string;
  typeArguments: string[];
  arguments: string[];
};

export type TxPayloadInstallModule = {
  type: 'module_bundle_payload';
  modules: { bytecode: string }[];
};

export type AptosTxPayload = TxPayloadCallFunction | TxPayloadInstallModule;

export type AptosCreateTx = {
  sender: string;
  maxGasAmount: string;
  gasUnitPrice: string;
  gasCurrencyCode: string;
  expiration: string;
  payload: AptosTxPayload;
};
