# LiquidSwap SDK

The typescript SDK for [Liquidswap](https://liquidswap.com).

# Installation

    npm i @pontem/liquidswap-sdk

# Usage

### Init SDK

```typescript
import { SDK } from '@pontem/liquidswap-sdk';
import Decimal from "decimal.js";

const sdk = new SDK({
  nodeUrl: 'https://fullnode.testnet.aptoslabs.com/v1', // Node URL
  networkOptions: {
    nativeToken: '0x1::aptos_coin::AptosCoin'', // Type of Native network token
    modules: {
      Scripts:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2', // This module is used for Swap
      CoinInfo: '0x1::coin::CoinInfo', // Type of base CoinInfo module
      CoinStore: '0x1::coin::CoinStore', // Type of base CoinStore module
      LiquidityPool: '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948::liquidity_pool' // Liquidity pool module
    },
  }
})
```

### You want swap EXACTLY 1 APTOS to SLIPPAGED USDT amount

```typescript
(async () => {
  // Get BTC amount
  const amount = await sdk.Swap.calculateRates({
    fromToken: '0x1::aptos_coin::AptosCoin', // APTOS
    toToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::USDT', // USDT
    amount: new Decimal(1000000), // 1 APTOS (6 decimals)
    interactiveToken: 'from',
    curveType: 'stable',
  })
  console.log(amount) // '1651.7512324524539471' (0.0016517512324524539471 USDT)

  // Generate TX payload for swap 1 APTOS to maximum 0.01584723 BTC
  // and minimum 0.01584723 BTC - 5% (with slippage 5%)
  const txPayload = sdk.Swap.createSwapTransactionPayload({
    fromToken: '0x1::aptos_coin::AptosCoin',
    toToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
    fromAmount: new Decimal(1000000), // 1 APTOS,
    toAmount: new Decimal(1584723), // 0.01584723 BTC,
    interactiveToken: 'from',
    slippage: new Decimal(0.05), // 5% (1 - 100%, 0 - 0%)
    stableSwapType: 'high',
    curveType: 'stable',
  })
  console.log(txPayload);
  /**
   Output:
   {
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable'
      ],
      arguments: [ '1000000', '1505487' ]
    }
   */
})()
```

### You want get EXACTLY 0.001 BTC and send SLIPPAGED APTOS amount
```typescript
(async () => {
  // Get APTOS amount
  const amount = await sdk.Swap.calculateRates({
    fromToken: '0x1::aptos_coin::AptosCoin',
    toToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
    amount: new Decimal(100000), // 0.001 BTC
    interactiveToken: 'to', // 'from' - calculate TO amount, 'to' - calculate FROM amount
    curveType: 'stable',
  })
  console.log(amount) // '2741440067.7675726625' (2741.4400677675726625 APTOS)

  // Generate TX payload for get EXACTLY 0.001 BTC
  // and minimum send 2741.440068 + 5% (with slippage 5%)
  const txPayload = sdk.Swap.createSwapTransactionPayload({
    fromToken: '0x1::aptos_coin::AptosCoin',
    toToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
    fromAmount: new Decimal(2741440068), // 2741.440068 APTOS,
    toAmount: new Decimal(100000), // 0.001 BTC,
    interactiveToken: 'to',
    slippage: new Decimal(0.05), // 5% (1 - 100%, 0 - 0%)
    stableSwapType: 'high',
    curveType: 'stable',
  })
  console.log(txPayload);
  /**
   Output:
   {
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_into',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable'
      ],
      arguments: [ '2604368065', '100000' ]
    }
   */
})()
```
