
export const NODE_URL = process.env.APTOS_NODE_URL || "https://aptos-devnet.pontem.network";
export const FAUCET_URL = process.env.APTOS_FAUCET_URL || "https://faucet.devnet.aptoslabs.com";

export const RESOURCE_ACCOUNT = "0xf5f11a0fa0ef6e2cd215d73cc3bd3c4cc2ad5b1c24625a690aadc9b13a57eaff";
export const MODULES_ACCOUNT = "0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9";

export const TokensMapping: Record<string, string> = {
  APTOS: '0x1::aptos_coin::AptosCoin', // APTOS
  USDT: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::USDT', //devnet USDT
};
