import dotenv from "dotenv";
import SDK from "@pontem/liquidswap-sdk";
import { FaucetClient, AptosAccount, CoinClient } from 'aptos';

import {NODE_URL, TokensMapping, FAUCET_URL, MODULES_ACCOUNT, RESOURCE_ACCOUNT} from "./common";

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
    networkOptions: {
      resourceAccount: RESOURCE_ACCOUNT,
      moduleAccount: MODULES_ACCOUNT,
      modules: {
        Scripts: `${MODULES_ACCOUNT}::scripts_v2`,
        CoinInfo: '0x1::coin::CoinInfo',
        CoinStore: '0x1::coin::CoinStore'
      },
    },
  });
  const client = sdk.client;
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
  const coinClient = new CoinClient(client);

  // create local account
  const alice = new AptosAccount();

  // make Faucet create and fund account
  await faucetClient.fundAccount(alice.address(), 100_000_000);

  // check balances
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);

  try {
    const usdtBalance = await coinClient.checkBalance(alice, {coinType: 'USDT'});

    console.log(`Alice USDT balance: ${usdtBalance}`);
  } catch(e) {
    console.log(e);
    //need to register USDT
    const registerPayloadUSDT = {
      function: "0x1::managed_coin::register",
      type_arguments: [
        TokensMapping.USDT
    ],
      arguments: []
    }
    try {
      const rawTxn = await client.generateTransaction(alice.address(), registerPayloadUSDT);
      const bcsTxn = await client.signTransaction(alice, rawTxn);
      const { hash } = await client.submitTransaction(bcsTxn);
      await client.waitForTransaction(hash);

      console.log(`Registered USDT coin ${hash} submitted`);
    } catch (e) {
      console.log(e)
    }
  }

  // get Rate for USDT coin.
  const usdtRate = await sdk.Swap.calculateRates({
    fromToken: TokensMapping.APTOS,
    toToken: TokensMapping.USDT,
    amount: 100000000, // 1 APTOS
    curveType: 'uncorrelated',
    interactiveToken: 'from',
  });

  console.log('usdtRate', usdtRate);

  // create payload for swap transaction
  const swapTransactionPayload = await sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      fromAmount: 100000000, // 1 APTOS
      toAmount: Number(usdtRate), // USDT
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'high',
      curveType: 'uncorrelated',
  }) as TxPayloadCallFunction;

  console.log('swapTransactionPayload', swapTransactionPayload);

  const rawTxn = await client.generateTransaction(alice.address(), swapTransactionPayload);
  console.log(1);
  const bcsTxn = await client.signTransaction(alice, rawTxn);
  console.log(2);

  const { hash } = await client.submitTransaction(bcsTxn)
  console.log(3);

  await client.waitForTransaction(hash);

  console.log(4);

  console.log(`Transaction ${hash} is signed`);
})();
