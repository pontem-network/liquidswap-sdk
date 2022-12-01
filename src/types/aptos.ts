export type AptosResourceType = string;

export type AptosResource<T = unknown> = {
  data: T;
  type: string;
};

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
  fee: number;
};

export type TxPayloadCallFunction = {
  type: 'entry_function_payload';
  function: string;
  type_arguments: string[];
  arguments: string[];
};

export type TAptosTxPayload = TxPayloadCallFunction;

export type CurveType = 'uncorrelated' | 'stable';
