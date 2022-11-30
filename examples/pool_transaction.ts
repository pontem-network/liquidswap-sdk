import dotenv from "dotenv";
import SDK from "@pontem/liquidswap-sdk";
import { AptosClient, FaucetClient, AptosAccount, CoinClient } from 'aptos';

import {NODE_URL, TokensMapping, FAUCET_URL, RESOURCE_ACCOUNT, MODULES_ACCOUNT} from "./common";

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
  const client = new AptosClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  const coinClient = new CoinClient(client);

  // create local accounts
  const alice = new AptosAccount();

  try {

    // make Faucet create and fund accounts
    await faucetClient.fundAccount(alice.address(), 100_000_000);

    // check balances
    console.log(`Alice: ${await coinClient.checkBalance(alice)}`);

    const poolExisted = await sdk.Liquidity.checkPoolExistence({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      curveType: 'uncorrelated'
    });

    console.log(`Pool existed: ${poolExisted}`);

    const { rate, receiveLp } = await sdk.Liquidity.calculateRateAndMinReceivedLP({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      amount: 100000000, // 1 USDT
      curveType: 'uncorrelated',
      interactiveToken: 'to',
      slippage: 0.005,
    });

    console.log(`rate: ${rate}, Minimum receive Lp: ${receiveLp}`);

    const createPoolPayload = await sdk.Liquidity.createAddLiquidityPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      fromAmount: Number(rate), // APTOS
      toAmount: 100000000, // 1 USDT
      interactiveToken: 'to',
      slippage: 0.005,
      curveType: 'uncorrelated',
    });

    console.log('createPoolPayload', createPoolPayload);

    const rawTxn = await client.generateTransaction(alice.address(), createPoolPayload);
    const bcsTxn = await client.signTransaction(alice, rawTxn);
    const { hash } = await client.submitTransaction(bcsTxn);
    await client.waitForTransaction(hash);
    console.log(`Transaction ${hash} is submitted`);

  } catch(e) {
    console.log(e)
  }
})();
