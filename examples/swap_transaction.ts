import dotenv from "dotenv";
import SDK from "@pontem/liquidswap-sdk";
import Decimal from "decimal.js";
import { AptosClient, FaucetClient, AptosAccount, CoinClient } from 'aptos';

import { NODE_URL, TokensMapping, FAUCET_URL } from "./common";

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
  console.log(`Bob: ${await coinClient.checkBalance(bob)}`);


  const usdtRate = await sdk.Swap.calculateRates({
    fromToken: TokensMapping.APTOS,
    toToken: TokensMapping.USDT,
    amount: 100000000, // 1 APTOS
    curveType: 'uncorrelated',
    interactiveToken: 'from',
  });

  const swapTransactionPayload = await sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      fromAmount: new Decimal(100000000), // 1 APTOS
      toAmount: new Decimal(usdtRate), // 4.304638 USDT
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'high',
      curveType: 'uncorrelated',
  });



  // await client.waitForTransaction(txnHash);
})();
