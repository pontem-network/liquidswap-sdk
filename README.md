# LiquidSwap SDK

# Usage
### Init SDK
```typescript
import { SDK } from '@pontem/liquidswap-sdk';

// Using default config
const sdk = new SDK();

// With custom parameters
const sdk = new SDK({
  nodeUrl: 'https://fullnode.devnet.aptoslabs.com', // Node URL
  networkOptions: {
    nativeToken: '0x1::test_coin::TestCoin', // Type of Native network token
    modules: {
      LiquidswapDeployer: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9', // The address of liquidswap contracts deployer
      CoinInfo: '0x1::coin::CoinInfo', // Type of base CoinInfo module
      CoinStore: '0x1::coin::CoinStore', // Type of base CoinStore module
    },
  }
})
```

### You want swap EXACTLY 1 APTOS to SLIPPAGED BTC amount
```typescript
(async () => {
  // Get BTC amount received after swap.
  const amount = await sdk.Swap.getAmountIn({
    coinIn: '0x1::test_coin::TestCoin', // Coin we want to swap.
    coinOut: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC', // Coin we want to get.
    amount: 1000000, // Amount we want to swap: 1 APTOS.
    pool: {
      address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9', // Address of pool creator (as he's storing pool resource). 
      lpCoin: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>' // LP coin of the pool.
    }
  })
  console.log(amount) // Amount of BTC we will get after swap of 1000000 (1.0 APTOS) = 1584723 (0.01584723 BTC)

  // Generate TX payload for swap of 1.0 APTOS and get minimum 0.01584723 BTC - 5% (with slippage 5%).
  const txPayload = sdk.Swap.createSwapExactAmountPayload({
    coinIn: '0x1::test_coin::TestCoin', // Coin we want to swap.
    coinOut: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC', // Coin we want to get.
    coinInAmount: 1000000, // We want to swap 1 APTOS.
    coinOutAmount: 1584723, // We should get at least 1584723 (0.01584723 BTC, without slippage).
    slippage: 0.05, // Current sippage is 5% (1 - 100%, 0 - 0%).
    pool: {
      address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',  // Address of pool creator (as he's storing pool resource). 
      lpCoin: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>'  // LP coin of the pool.
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
  // Get APTOS amount needed to get exact amount of BTC.
  const coinInAmount = await sdk.Swap.getAmountOut({
    coinIn: '0x1::test_coin::TestCoin', // Coin we want to swap.
    coinOut: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC', // Coin we want to get.
    amount: 100000, // Amount of coin we want to get: 0.001 BTC
    pool: {
      address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9', // Address of pool creator (as he's storing pool resource). 
      lpCoin: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>' // LP coin of the pool.
    }
  })
  console.log(amount) // We need 116831 (0.116831 APTOS) to get 0.001 BTC.

  // Generate TX payload to get EXACTLY 0.001 BTC and maximum spend 0.116831 + 5% APTOS (with slippage 5%).
  const txPayload = sdk.Swap.createSwapForExactAmountPayload({
    coinIn: '0x1::test_coin::TestCoin', // Coin we want to swap
    coinOut: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC', // Coin we want to get.
    coinInAmount: 116831, // We will swap at least 116831 (0.116831 + 5% slippage APTOS) to get BTC.
    coinOutAmount: 100000, // We want to get exactly: 0.001 BTC.
    slippage: 0.05, // Current slippage is 5% (1 - 100%, 0 - 0%)
    pool: {
      address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9', // Address of pool creator (as he's storing pool resource). 
      lpCoin: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>'  // LP coin of the pool.
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
