export const MODULES_ACCOUNT = '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12';
export const RESOURCES_ACCOUNT = '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948';
export const COINS_ACCOUNT = '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9';
export const MODULES_V05_ACCOUNT = '0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e';
export const RESOURCES_V05_ACCOUNT = '0x61d2c22a6cb7831bee0f48363b0eec92369357aece0d1142062f7d5d85c7bef8';

export const COIN_INFO = '0x1::coin::CoinInfo';
export const COIN_STORE = '0x1::coin::CoinStore';

export const SCRIPTS_V1 = 'scripts';
export const SCRIPTS_V2 = 'scripts_v2';
export const VERSION_0 = 0;
export const VERSION_0_5 = 0.5;

export const NETWORKS_MODULES = {
  Scripts: `${MODULES_ACCOUNT}::scripts_v2`,
  Faucet: `${COINS_ACCOUNT}::faucet`,
  CoinInfo: `${COIN_INFO}`,
  CoinStore: `${COIN_STORE}`,
};

export const TOKENS_MAPPING: Record<string, string> = {
  APTOS: '0x1::aptos_coin::AptosCoin',
  USDT: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT', //layerzero USDT
  BTC: '0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T', // wormhole wrapped BTC
  WETH: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH', // LayerZero WETH
  USDC: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC', // layerzero USDC
  amAPT: '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt' // Amnis APT
};
