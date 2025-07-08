import { AccountAddress, Aptos } from "@aptos-labs/ts-sdk";

export const RESOURCE_ACCOUNT = "0x61d2c22a6cb7831bee0f48363b0eec92369357aece0d1142062f7d5d85c7bef8";
export const MODULES_ACCOUNT = "0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e";

export const TokensMapping = {
  APTOS: '0x1::aptos_coin::AptosCoin', // APTOS
  LSD: '0x53a30a6e5936c0a4c5140daed34de39d17ca7fcae08f947c02e979cef98a3719::coin::LSD', //LSD
} as const;

/**
 * Prints the balance of an account
 * @param aptos
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
export const balance = async (aptos: Aptos, name: string, address: AccountAddress) => {
  const balances = await aptos.fungibleAsset.getCurrentFungibleAssetBalances({
    options: {
      where: {
        owner_address: {
          _eq: address.toString(),
        },
      }
    }
  });
  const aptBalance = balances.find(b => b.asset_type === TokensMapping.APTOS);
  const amount = Number(aptBalance?.amount);

  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};
