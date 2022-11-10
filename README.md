# LiquidSwap SDK

The typescript SDK for [Liquidswap](https://liquidswap.com).

# Installation

    npm i @pontem/liquidswap-sdk

# Usage

### Init SDK

```typescript
import { SDK } from '@pontem/liquidswap-sdk';
import Decimal from 'decimal.js';

const sdk = new SDK({
  nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1', // Node URL, required
  /**
    networkOptions is optional

    networkOptions: {
      nativeToken: '0x1::aptos_coin::AptosCoin', - Type of Native network token
      modules: {
        Scripts:
          '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2',  - This module is used for Swap
        CoinInfo: '0x1::coin::CoinInfo', - Type of base CoinInfo module
        CoinStore: '0x1::coin::CoinStore', - Type of base CoinStore module
      },
    }
  */
})
```

### You want swap EXACTLY 1 APTOS to SLIPPAGED layerzero USDT amount

```typescript
(async () => {
  // Get USDT amount
  const output = await sdk.Swap.calculateRates({
    fromToken: '0x1::aptos_coin::AptosCoin',
    toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT', // layerzero USDT
    amount: new Decimal(100000000), // 1 APTOS as Decimal amount
    curveType: 'uncorrelated',
    interactiveToken: 'from',
  })
  console.log(amount) // '4995851.2364508969978' (4.995851 USDT)

  // Generate TX payload for swap 1 APTOS to maximum 4.995851 USDT
  // and minimum 4.746058 USDT - 5% (with slippage 5%)
  const txPayload = sdk.Swap.createSwapTransactionPayload({
    fromToken: '0x1::aptos_coin::AptosCoin',
    toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT', // layerzero USDT
    fromAmount: new Decimal(100000000), // 1 APTOS,
    toAmount: new Decimal(4995851), // 4.995851 USDT,
    interactiveToken: 'from',
    slippage: new Decimal(0.05), // 5% (1 - 100%, 0 - 0%)
    stableSwapType: 'normal',
    curveType: 'uncorrelated',
  })
  console.log(txPayload);
  /**
   Output:
   {
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated'
      ],
      arguments: [ '100000000', '4746058' ]
    }

   */
})()
```

### You want get EXACTLY 1 BTC and send SLIPPAGED APTOS amount
```typescript
(async () => {
  // Get APTOS amount
  const amount = await sdk.Swap.calculateRates({
    fromToken: '0x1::aptos_coin::AptosCoin',
    toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
    amount: new Decimal(1000000), // 1 USDT
    interactiveToken: 'to', // 'from' - calculate TO amount, 'to' - calculate FROM amount
    curveType: 'uncorrelated',
  })
  console.log(amount) // '20032733.69689480612' (0.20032734 APTOS)

  // Generate TX payload for get EXACTLY 1 USDT
  // and minimum send 0.20032734 + 5% (with slippage 5%)
  const txPayload = sdk.Swap.createSwapTransactionPayload({
    fromToken: '0x1::aptos_coin::AptosCoin',
    toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
    fromAmount: new Decimal(20032734), // 0.20032734 APTOS,
    toAmount: new Decimal(1000000), // 1 USDT,
    interactiveToken: 'to',
    slippage: new Decimal(0.05), // 5% (1 - 100%, 0 - 0%)
    stableSwapType: 'normal',
    curveType: 'uncorrelated',
  })
  console.log(txPayload);
  /**
   Output:
   {
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_into',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated'
      ],
      arguments: [ '21034371', '1000000' ]
    }
   */
})()
```
