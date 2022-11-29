import dotenv from "dotenv";
import SDK from "@pontem/liquidswap-sdk";
import { AptosClient, FaucetClient, AptosAccount, CoinClient } from 'aptos';

import { NODE_URL, TokensMapping, FAUCET_URL } from "./common";

export type TxPayloadCallFunction = {
  type: 'entry_function_payload';
  function: string;
  type_arguments: string[];
  arguments: string[];
};

dotenv.config();

(async() => {

  // setup
  const sdk = new SDK({
    nodeUrl: NODE_URL,
  });
  const client = new AptosClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
  const pontemFaucetClient = new FaucetClient(NODE_URL, 'pontem_node_url')

  const coinClient = new CoinClient(client);

  // create local accounts
  const alice = new AptosAccount();

  // make Faucet create and fund accounts
  await faucetClient.fundAccount(alice.address(), 100_000_000);
  await pontemFaucetClient.fundAccount(alice.address(), 100_000_000);

  // check balances
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);

  const poolExisted = await sdk.Liquidity.checkPoolExistence({
    fromToken: TokensMapping.APTOS,
    toToken: TokensMapping.USDT,
    curveType: 'stable'
  });

  console.log(`Pool existed: ${poolExisted}`);

  if (!poolExisted) {
    const createPoolPayload = await sdk.Liquidity.createAddLiquidityPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      fromAmount: 10000000, // 0.000004 APTOS
      toAmount: 19, // 0.000019 USDC
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'normal', // need to refa1ctor and removed it
      curveType: 'uncorrelated',
    });
    console.log(createPoolPayload);

  }



})();
