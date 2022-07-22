# LiquidSwap SDK

# Usage
### Init SDK
```typescript
import { SDK } from '@pontem/liquidswap-sdk';

const sdk = new SDK({
  nodeUrl: 'https://fullnode.devnet.aptoslabs.com', // Node URL
  networkOptions: {
    nativeToken: '0x1::test_coin::TestCoin', // Type of Native network token
    modules: {
      Scripts:
        '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::scripts', // This module is used for Swap
      CoinInfo: '0x1::coin::CoinInfo', // Type of base CoinInfo module
      CoinStore: '0x1::coin::CoinStore', // Type of base CoinStore module
    },
  }
})
```

### You want swap EXACTLY 1 APTOS to SLIPPAGED BTC amount
```typescript
(async () => {
  // Get BTC amount
  const amount = await sdk.Swap.calculateRates({
    fromToken: '0x1::test_coin::TestCoin',
    toToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
    amount: 1000000, // 1 APTOS
    interactiveToken: 'from',
    pool: {
      address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
      moduleAddress: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
      lpToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>'
    }
  })
  console.log(amount) // 1584723 (0.01584723 BTC)

  // Generate TX payload for swap 1 APTOS to maximum 0.01584723 BTC
  // and minimum 0.01584723 BTC - 5% (with slippage 5%)
  const txPayload = sdk.Swap.createSwapTransactionPayload({
    fromToken: '0x1::test_coin::TestCoin',
    toToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
    fromAmount: 1000000, // 1 APTOS,
    toAmount: 1584723, // 0.01584723 BTC,
    interactiveToken: 'from',
    slippage: 0.05, // 5% (1 - 100%, 0 - 0%)
    pool: {
      address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
      moduleAddress: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
      lpToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>'
    }
  })
  console.log(txPayload);
  /**
   Output:
   {
      type: 'script_function_payload',
      function: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::scripts::swap',
      typeArguments: [
        '0x1::test_coin::TestCoin',
        '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
        '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>'
      ],
      arguments: [
        '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        '1000000',
        '1505487'
      ]
    }
   */
})()
```

### You want get EXACTLY 0.001 BTC and send SLIPPAGED APTOS amount
```typescript
(async () => {
  // Get APTOS amount
  const amount = await sdk.Swap.calculateRates({
    fromToken: '0x1::test_coin::TestCoin',
    toToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
    amount: 100000, // 0.001 BTC
    interactiveToken: 'to', // from - calculate TO amount, to - calculate FROM amount
    pool: {
      address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
      moduleAddress: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
      lpToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>'
    }
  })
  console.log(amount) // 116831 (0.116831 APTOS)

  // Generate TX payload for get EXACTLY 0.001 BTC
  // and minimum send 0.116831 + 5% (with slippage 5%)
  const txPayload = sdk.Swap.createSwapTransactionPayload({
    fromToken: '0x1::test_coin::TestCoin',
    toToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
    fromAmount: 116831, // 0.116831 APTOS,
    toAmount: 100000, // 0.001 BTC,
    interactiveToken: 'to',
    slippage: 0.05, // 5% (1 - 100%, 0 - 0%)
    pool: {
      address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
      moduleAddress: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
      lpToken: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>'
    }
  })
  console.log(txPayload);
  /**
   Output:
   {
      type: 'script_function_payload',
      function: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::scripts::swap_into',
      typeArguments: [
        '0x1::test_coin::TestCoin',
        '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
        '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>'
      ],
      arguments: [
        '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        '110989',
        '100000'
      ]
    }
   */
})()
```
