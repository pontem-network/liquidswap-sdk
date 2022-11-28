# LiquidSwap SDK

The typescript SDK for [Liquidswap](https://liquidswap.com).

# Installation

    npm i @pontem/liquidswap-sdk

# Roadmap:
  * Integrate aptos-sdk to provide opportunity successfully complete a transaction and receive a hash.

# Usage

### Init SDK

```typescript
import { SDK, convertValueToDecimal } from '@pontem/liquidswap-sdk';

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
### You want to convert 15 coins to Decimal type with 8 decimals (coins like APTOS, BTC, etc);

```typescript
// convertValueToDecimal return Decimal type;
const decimalValue = convertValueToDecimal(15, 8); // 1500000000 (15 coin with 8 decimals)
or
const decimalValue2 = convertValueToDecimal('0.005', 8); // 500000 (0.005 coin with 8 decimals)

```


### You want swap EXACTLY 1 APTOS to SLIPPAGED layerzero USDT amount

```typescript
(async () => {
  // Get USDT amount
  try {
    const output = await sdk.Swap.calculateRates({
      fromToken: '0x1::aptos_coin::AptosCoin', // full 'from' token address
      toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT', // full 'to' token address layerzero USDT
      amount: 100000000, // 1 APTOS, or you can use convertValueToDecimal(1, 8)
      curveType: 'uncorrelated', // can be 'uncorrelated' or 'stable'
      interactiveToken: 'from', // which token is 'base' to calculate other token rate.
    })
    console.log(output) // '4304638' (4.304638 USDT)

    // Generate TX payload for swap 1 APTOS to maximum 4.304638 USDT
    // and minimum 4.283115 USDT (with slippage -0.5%)
    const txPayload = sdk.Swap.createSwapTransactionPayload({
      fromToken: '0x1::aptos_coin::AptosCoin',
      toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT', // layerzero USDT
      fromAmount: 100000000, // 1 APTOS, or you can use convertValueToDecimal(1, 8)
      toAmount: 4304638, // 4.304638 USDT, or you can use convertValueToDecimal(4.304638, 6)
      interactiveToken: 'from',
      slippage: 0.005, // 0.5% (1 - 100%, 0 - 0%)
      stableSwapType: 'high',
      curveType: 'uncorrelated',
    })
    console.log(txPayload);
  } catch(e) {
    console.log(e)
  }

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
      arguments: [ '100000000', '4283115' ]
    }

   */
})()
```

### You want get EXACTLY 1 USDT and send SLIPPAGED APTOS amount
```typescript
(async () => {
  // Get APTOS amount
  try {
    const amount = await sdk.Swap.calculateRates({
      fromToken: '0x1::aptos_coin::AptosCoin',
      toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
      amount: 1000000, // 1 layerzero USDT
      interactiveToken: 'to',
      curveType: 'uncorrelated',
    })
    console.log(amount) // '23211815' ('0.23211815' APTOS)

    // Generate TX payload for get EXACTLY 1 USDT
    // and minimum send 0.23327874 (with slippage +0.5%)
    const txPayload = sdk.Swap.createSwapTransactionPayload({
      fromToken: '0x1::aptos_coin::AptosCoin',
      toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
      fromAmount: convertValueToDecimal(0.23211815, 8), // 0.23211815 APTOS,
      toAmount: convertValueToDecimal(1, 6), // 1 layerzero USDT,
      interactiveToken: 'to',
      slippage: 0.005, // 0.5% (1 - 100%, 0 - 0%)
      stableSwapType: 'hign',
      curveType: 'uncorrelated',
    })
    console.log(txPayload);
  } catch (e) {
    console.log(e);
  }

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
      arguments: [ '23327874', '1000000' ]
    }
   */
})()
```

### You want swap EXACTLY 1 APTOS to wormhole WETH with curve - 'stable', stableSwapType - 'normal' and 0.5% slippage
```typescript
(async () => {
  // Get WETH amount
  try {
    const amount = await sdk.Swap.calculateRates({
      fromToken: '0x1::aptos_coin::AptosCoin',
      toToken: '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T', // wormhole WETH (whWETH)
      amount: 100000000, // 1 APTOS
      interactiveToken: 'from',
      curveType: 'stable',
    })
    console.log(amount) // '175257' ('0.00175257' whWETH)

    // Generate TX payload to swap 1 APTOS to
    // and minimum send 0.00174381 (with slippage -0.5%)
    const txPayload = sdk.Swap.createSwapTransactionPayload({
      fromToken: '0x1::aptos_coin::AptosCoin',
      toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
      fromAmount: convertValueToDecimal(1, 8), // 1 Aptos
      toAmount: convertValueToDecimal(0.00175257, 8), // 0.00175257 whWETH,
      interactiveToken: 'from',
      slippage: 0.005, // 0.5% (1 - 100%, 0 - 0%)
      stableSwapType: 'normal',
      curveType: 'stable',
    })
    console.log(txPayload);
  } catch (e) {
    console.log(e);
  }

  /**
   Output:
   {
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_unchecked',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable'
      ],
      arguments: [ '100000000', '174381' ]
    }
   */
})()
```

### You want to get EXACTLY 1 USDA and send SLIPPAGED APTOS amount with curve - 'stable', stableSwapType - 'high' and 0.5% slippage
```typescript
(async () => {
  // Get APTOS amount
  try {
    const amount = await sdk.Swap.calculateRates({
      fromToken: '0x1::aptos_coin::AptosCoin',
      toToken: '0x1000000fa32d122c18a6a31c009ce5e71674f22d06a581bb0a15575e6addadcc::usda::USDA', // USDA
      amount: 1000000, // 1 USDA
      interactiveToken: 'to',
      curveType: 'stable',
    })
    console.log(amount) // '12356861' ('0.12356861' APTOS)

    // Generate TX payload to swap 1 APTOS to
    // and minimum send 0.12418645 (with slippage +0.5%)
    const txPayload = sdk.Swap.createSwapTransactionPayload({
      fromToken: '0x1::aptos_coin::AptosCoin',
      toToken: '0x1000000fa32d122c18a6a31c009ce5e71674f22d06a581bb0a15575e6addadcc::usda::USDA',
      fromAmount: convertValueToDecimal(0.12356861, 8), // 0.12356861 APTOS
      toAmount: convertValueToDecimal(1, 6), // 1 USDA,
      interactiveToken: 'to',
      slippage: 0.005, // 0.5% (1 - 100%, 0 - 0%)
      stableSwapType: 'high',
      curveType: 'stable',
    })
    console.log(txPayload);
  } catch (e) {
    console.log(e);
  }

  /**
   Output:
   {
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_into',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0x1000000fa32d122c18a6a31c009ce5e71674f22d06a581bb0a15575e6addadcc::usda::USDA',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable'
      ],
      arguments: [ '12418645', '1000000' ]
    }
   */
})()
```

### A lot of additional examples located here: '[src/main.test.ts](src/main.test.ts)';
