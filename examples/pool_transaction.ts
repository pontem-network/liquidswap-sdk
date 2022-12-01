import dotenv from "dotenv";
import SDK from "@pontem/liquidswap-sdk";
import { AptosClient, FaucetClient, AptosAccount, CoinClient } from 'aptos';

import {NODE_URL, TokensMapping, FAUCET_URL, RESOURCE_ACCOUNT, MODULES_ACCOUNT} from "./common";

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
    console.log(`Alice balance: ${await coinClient.checkBalance(alice)}`);

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
    } catch(e) {
      console.log("Coin register error: ", e);
    }

    //check pool existence
    const poolExisted = await sdk.Liquidity.checkPoolExistence({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      curveType: 'uncorrelated'
    });
    console.log(`Pool existed: ${poolExisted}`);

    // get rate and Minimum received LP
    const { rate, receiveLp } = await sdk.Liquidity.calculateRateAndMinReceivedLP({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      amount: 100000000, // 1 APTOS
      curveType: 'uncorrelated',
      interactiveToken: 'from',
      slippage: 0.005,
    });
    console.log(`rate: ${rate}, Minimum receive Lp: ${receiveLp}`);

    // get payload to add LiquidityPool
    const addLiquidityPoolPayload = await sdk.Liquidity.createAddLiquidityPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      fromAmount: 100000000, // 1 APTOS
      toAmount: Number(rate), // USDT
      interactiveToken: 'from',
      slippage: 0.005,
      curveType: 'uncorrelated',
    });
    console.log('Add liquidity pool payload', addLiquidityPoolPayload);

    // sign and submit payload
    const addLiquidityRawTxn = await client.generateTransaction(alice.address(), addLiquidityPoolPayload);
    const addLiquidityBcsTxn = await client.signTransaction(alice, addLiquidityRawTxn);
    const { hash: addLiquidityHash } = await client.submitTransaction(addLiquidityBcsTxn);
    await client.waitForTransaction(addLiquidityHash);
    console.log(`Add liquidity transaction with hash ${addLiquidityHash} is submitted`);

    // calculate Burn Liquidity Minimum received values
    const outputBurnValues = await sdk.Liquidity.calculateOutputBurn({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      slippage: 0.005,
      curveType: 'uncorrelated',
      burnAmount: Number(receiveLp),
    });

    console.log(`coin X: ${outputBurnValues?.x}, coin Y: ${outputBurnValues?.y},\n
    withoutSlippage: coin X: ${outputBurnValues?.withoutSlippage.x} coin Y: ${outputBurnValues?.withoutSlippage.y} `);

    const burnLiquidityPayload = await sdk.Liquidity.createBurnLiquidityPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      slippage: 0.005,
      curveType: 'uncorrelated',
      burnAmount: Number(receiveLp),
    });

    console.log('Burn liquidity payload: ', burnLiquidityPayload);

    // sign and submit payload
    const burnLiquidityRawTxn = await client.generateTransaction(alice.address(), burnLiquidityPayload);
    const burnLiquidityBcsTxn = await client.signTransaction(alice, burnLiquidityRawTxn);
    const { hash: burnLiquidityHash } = await client.submitTransaction(burnLiquidityBcsTxn);
    await client.waitForTransaction(burnLiquidityHash);
    console.log(`Burn liquidity transaction ${burnLiquidityHash} is submitted`);

  } catch(e) {
    console.log(e)
  }
})();
