import dotenv from "dotenv";
import SDK from "@pontem/liquidswap-sdk";
import Decimal from "decimal.js";
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
  const coinClient = new CoinClient(client);

  // create local accounts
  const alice = new AptosAccount();
  const bob = new AptosAccount();

  // make Faucet create and fund accounts
  await faucetClient.fundAccount(alice.address(), 100_000_000);
  await faucetClient.fundAccount(bob.address(), 0);

  // check balances
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);

  // get Rate for USDT coin.
  const usdtRate = await sdk.Swap.calculateRates({
    fromToken: TokensMapping.APTOS,
    toToken: TokensMapping.USDT,
    amount: 100000000, // 1 APTOS
    curveType: 'uncorrelated',
    interactiveToken: 'from',
  });

  // create payload for swap transaction
  const swapTransactionPayload = await sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      fromAmount: new Decimal(100000000), // 1 APTOS
      toAmount: new Decimal(usdtRate), // 4.304638 USDT
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'high',
      curveType: 'uncorrelated',
  }) as TxPayloadCallFunction;

  const generatedTransaction = await client.generateTransaction(alice.address(), swapTransactionPayload);

  const txnHash = await client.generateSignSubmitTransaction(alice, generatedTransaction);

  const signed = await client.waitForTransaction(txnHash);

  console.log(`Transaction {txnHash} is signed with status: ${signed}`);
})();
