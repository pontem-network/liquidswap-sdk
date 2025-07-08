import dotenv from "dotenv";
import SDK from "@pontem/liquidswap-sdk";

import {
  TokensMapping,
  RESOURCE_ACCOUNT,
  MODULES_ACCOUNT,
} from "./common";
import { Network, NetworkToNodeAPI } from "@aptos-labs/ts-sdk";

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
        CoinStore: '0x1::coin::CoinStore'
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
      interactiveToken: 'from',
    });

    console.log('LsdRate: ', lsdRate);

    // create payload for swap transaction
    const swapTransactionPayload = await sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.LSD,
      fromAmount: 10000000, // 0.1 APTOS
      toAmount: Number(lsdRate), // LSD
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'uncorrelated',
    });

    console.log('Swap Transaction Payload: ', swapTransactionPayload);

    //check pool existence
    const poolExisted = await sdk.Liquidity.checkPoolExistence({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.LSD,
      curveType: 'uncorrelated'
    });
    console.log(`Pool existed: ${poolExisted}`);

    // get rate and Minimum received LP
    const { rate, receiveLp } = await sdk.Liquidity.calculateRateAndMinReceivedLP({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.LSD,
      amount: 10000000, // 0.1 APTOS
      curveType: 'uncorrelated',
      interactiveToken: 'from',
      slippage: 0.005,
    });
    console.log(`rate: ${rate}, Minimum receive Lp: ${receiveLp}`);

    // get payload to add LiquidityPool
    const addLiquidityPoolPayload = await sdk.Liquidity.createAddLiquidityPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.LSD,
      fromAmount: 10000000, // 0.1 APTOS
      toAmount: Number(rate), // LSD
      interactiveToken: 'from',
      slippage: 0.005,
      curveType: 'uncorrelated',
    });
    console.log('Add liquidity pool payload', addLiquidityPoolPayload);

    // calculate Burn Liquidity Minimum received values
    const outputBurnValues = await sdk.Liquidity.calculateOutputBurn({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.LSD,
      slippage: 0.005,
      curveType: 'uncorrelated',
      burnAmount: Number(receiveLp),
    });

    console.log(`coin X: ${outputBurnValues?.x}, coin Y: ${outputBurnValues?.y},\n
    withoutSlippage: coin X: ${outputBurnValues?.withoutSlippage.x} coin Y: ${outputBurnValues?.withoutSlippage.y} `);

    const burnLiquidityPayload = await sdk.Liquidity.createBurnLiquidityPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.LSD,
      slippage: 0.005,
      curveType: 'uncorrelated',
      burnAmount: Number(receiveLp),
    });

    console.log('Burn liquidity payload: ', burnLiquidityPayload);
  } catch(e) {
    console.log(e)
  }
})();
