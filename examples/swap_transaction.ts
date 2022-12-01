import dotenv from "dotenv";
import SDK from "@pontem/liquidswap-sdk";
import { AptosAccount, CoinClient, FaucetClient } from 'aptos';

import { NODE_URL, TokensMapping, MODULES_ACCOUNT, RESOURCE_ACCOUNT, FAUCET_URL, NETWORKS_MAPPING } from "./common";

type TxPayloadCallFunction = {
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
    networkOptions: {
      resourceAccount: RESOURCE_ACCOUNT,
      moduleAccount: MODULES_ACCOUNT,
      modules: {
        Scripts: `${MODULES_ACCOUNT}::scripts_v2`,
        CoinInfo: '0x1::coin::CoinInfo',
        CoinStore: '0x1::coin::CoinStore',
      },
    },
  });
  const client = sdk.client;
  const coinClient = new CoinClient(client);

  // create local account
  const alice = new AptosAccount();

  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  await faucetClient.fundAccount(alice.address(), 100_000_000);

  console.log(`Account Balance ${await coinClient.checkBalance(alice)}`);

  // Register account with coin
  try {
    const coinRegisterPayload = {
      type: 'entry_function_payload',
      function: '0x1::managed_coin::register',
      type_arguments: [TokensMapping.USDT],
      arguments: [],
    }

    const rawTxn = await client.generateTransaction(alice.address(), coinRegisterPayload);
    const bcsTxn = await client.signTransaction(alice, rawTxn);
    const { hash } = await client.submitTransaction(bcsTxn);
    await client.waitForTransaction(hash);

    console.log(`Coin ${TokensMapping.USDT} successfully Registered to Alice account`);
    console.log(`Check on explorer: https://explorer.aptoslabs.com/txn/${hash}?network=${NETWORKS_MAPPING.DEVNET}`);
  } catch(e) {
    console.log("Coin register error: ", e);
  }

  try {
    // get Rate for USDT coin.
    const usdtRate = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      amount: 10000000, // 0.1 APTOS
      curveType: 'uncorrelated',
      interactiveToken: 'from',
    });

    console.log('SsdtRate: ', usdtRate);

    // create payload for swap transaction
    const swapTransactionPayload = await sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      fromAmount: 10000000, // 0.1 APTOS
      toAmount: Number(usdtRate), // USDT
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'uncorrelated',
    }) as TxPayloadCallFunction;

    console.log('Swap Transaction Payload: ', swapTransactionPayload);

    const rawTxn = await client.generateTransaction(alice.address(), swapTransactionPayload);
    const bcsTxn = await client.signTransaction(alice, rawTxn);
    const { hash } = await client.submitTransaction(bcsTxn);
    await client.waitForTransaction(hash);
    console.log(`Swap transaction ${hash} is submitted.`);
    console.log(`Check on explorer: https://explorer.aptoslabs.com/txn/${hash}?network=${NETWORKS_MAPPING.DEVNET}`);

  } catch (e) {
    console.log(e);
  }
})();
