import dotenv from "dotenv";
import SDK from "@pontem/liquidswap-sdk";
import { Network, NetworkToNodeAPI } from '@aptos-labs/ts-sdk';

import { TokensMapping, MODULES_ACCOUNT, RESOURCE_ACCOUNT } from "./common";

dotenv.config();

(async() => {

  // setup
  const sdk = new SDK({
    nodeUrl: NetworkToNodeAPI[Network.MAINNET],
    nodeOptions: {
      network: Network.MAINNET,
    },
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

  try {
    // get Rate for LSD coin.
    const lsdRate = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.LSD,
      amount: 10000000, // 0.1 APTOS
      curveType: 'uncorrelated',
      interactiveToken: 'to',
    });

    console.log('LsdRate: ', lsdRate);

    // create payload for swap transaction
    const swapTransactionPayload = await sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.LSD,
      fromAmount: 10000000, // 0.1 APTOS
      toAmount: Number(lsdRate), // LSD
      interactiveToken: 'to',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'uncorrelated',
    });

    console.log('Swap Transaction Payload: ', swapTransactionPayload);

    // const txn = await client.transaction.build.simple({
    //   data: swapTransactionPayload,
    //   sender: alice.accountAddress,
    // });

  } catch (e) {
    console.log(e);
  }
})();
