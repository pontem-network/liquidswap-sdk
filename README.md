<a name="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![GNUv3 License][license-shield]][license-url]

# LiquidSwap SDK

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

The typescript SDK for [Liquidswap](https://liquidswap.com).

## Installation

For NPM:

    npm i @pontem/liquidswap-sdk

For Yarn:

    yarn add @pontem/liquidswap-sdk

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Usage

<details>
  <summary>Init SDK</summary>

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
        resourceAccount: '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948',
        moduleAccount: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12',
        moduleAccountV05: '0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e',
        resourceAccountV05: '0x61d2c22a6cb7831bee0f48363b0eec92369357aece0d1142062f7d5d85c7bef8'
      }
    */
  })
  ```
</details>

<details>
  <summary>Convert 15 coins to Decimal type with 8 decimals (coins like APTOS, BTC, etc);</summary>

  ```typescript
  // convertValueToDecimal return Decimal type;
  const decimalValue = convertValueToDecimal(15, 8); // 1500000000 (15 coin with 8 decimals)
  or
  const decimalValue2 = convertValueToDecimal('0.005', 8); // 500000 (0.005 coin with 8 decimals)
  ```
</details>

<details>
  <summary>Swap EXACTLY 1 APTOS to SLIPPAGED layerzero USDT amount</summary>

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
        version: 0
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
        version: 0
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
        type_arguments: [
          '0x1::aptos_coin::AptosCoin',
          '0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T',
          '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated'
        ],
        arguments: [ '100000000', '4283115' ]
      }

    */
  })()
  ```
</details>

<details>
  <summary>Get EXACTLY 1 USDT and send SLIPPAGED APTOS amount</summary>

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
        version: 0
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
        version: 0
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
        type_arguments: [
          '0x1::aptos_coin::AptosCoin',
          '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
          '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated'
        ],
        arguments: [ '23327874', '1000000' ]
      }
    */
  })()
  ```
</details>

<details>
  <summary>Swap EXACTLY 1 APTOS to wormhole WETH with curve - 'stable', stableSwapType - 'normal' and 0.5% slippage</summary>

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
        version: 0
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
        version: 0
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
        type_arguments: [
          '0x1::aptos_coin::AptosCoin',
          '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T',
          '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable'
        ],
        arguments: [ '100000000', '174381' ]
      }
    */
  })()
  ```
</details>

<details>
  <summary>Get EXACTLY 1 USDA and send SLIPPAGED APTOS amount with curve - 'stable', stableSwapType - 'high' and 0.5% slippage</summary>

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
        version: 0
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
        version: 0
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
        type_arguments: [
          '0x1::aptos_coin::AptosCoin',
          '0x1000000fa32d122c18a6a31c009ce5e71674f22d06a581bb0a15575e6addadcc::usda::USDA',
          '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable'
        ],
        arguments: [ '12418645', '1000000' ]
      }
    */
  })()
  ```
</details>

<details>
  <summary>Check Pool Existence</summary>

  ```typescript
  (async() => {
    const output = await sdk.Liquidity.checkPoolExistence({
      fromToken: "0x1::aptos_coin::AptosCoin",
      toToken: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
      curveType: 'uncorrelated',
      version: 0
    });

    console.log(output); // true
  })
  ```
</details>

<details>
  <summary>Pools v.0.5: Swap 0.8 LayerZero USDT to LayerZero USDC</summary>

  ```typescript
  (async () => {
    // Get USDT amount
    try {
      const output = await sdk.Swap.calculateRates({
        fromToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC', //layerzero USDC
        toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT', // layerzero USDT
        amount: 800000, // 0.8 USDC, or you can use convertValueToDecimal(0.8, 6)
        curveType: 'stable', // can be 'uncorrelated' or 'stable'
        interactiveToken: 'from', // which token is 'base' to calculate other token rate.
        version: 0.5 // optional, version could be only 0 or 0.5. If not provided version is 0
      })
      console.log(output) // '601018' (0.601018 USDT)

      // Generate TX payload for swap 0.8 USDC to maximum 0.601018 USDT
      // and minimum 0.598013 USDT (with slippage -0.5%)
      const txPayload = sdk.Swap.createSwapTransactionPayload({
        fromToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
        toToken: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT', // layerzero USDT
        fromAmount: 800000, // 0.8 USDT, or you can use convertValueToDecimal(0.8, 6)
        toAmount: 601018, // 0.601018 USDC, or you can use convertValueToDecimal(0.601018, 6)
        interactiveToken: 'from',
        slippage: 0.005, // 0.5% (1 - 100%, 0 - 0%)
        stableSwapType: 'high',
        curveType: 'stable',
        version: 0.5,
      })
      console.log(txPayload);
    } catch(e) {
      console.log(e)
    }

    /**
     Output:
     {
        "arguments": [
          "800000",
          "598013"
        ],
        "function": "0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e::scripts::swap",
        "type": "entry_function_payload",
        "type_arguments": [
          "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
          "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
          "0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e::curves::Stable"
        ]
      }
    */
  })()
  ```
</details>

<details>
  <summary>Creating Liquidity Pool for pair APTOS / lzUSDC</summary>

  ```typescript
  (async () => {
    //get USDC amount
    const { rate, receiveLp } = await sdk.Liquidity.calculateRateAndMinReceivedLP({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDC,
      amount: 100000000, // 1 APTOS
      curveType: 'uncorrelated',
      interactiveToken: 'from',
      slippage: 0.005,
      version: 0
    });
    console.log(rate) // '4472498' ('4.472498' USDC)
    console.log(receiveLp) // '19703137' ('19.703137' Minimum Received LP)

    const payload = await sdk.Liquidity.createAddLiquidityPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDC,
      fromAmount: 100000000, // 1 APTOS
      toAmount: 4472498, // '4.472498' USDC)
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'uncorrelated',
      version: 0
    })

    console.log(payload);
    /**
     * {
        type: 'entry_function_payload',
        function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::add_liquidity',
        type_arguments: [
          "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
          "0x1::aptos_coin::AptosCoin",
          "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated",
        ],
        arguments: ['100000000', '99500000', '4472498', '4450136'],
      }
    * */
  })
  ```
</details>

<details>
  <summary>Calculate Output Burn for x and y coin with slippage and without slippage</summary>

  ```typescript
  (async()=> {
    const output = await sdk.Liquidity.calculateOutputBurn({
      fromToken: "0x1::aptos_coin::AptosCoin",
      toToken: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
      slippage: 0.005,
      curveType: 'uncorrelated',
      burnAmount: 100000,
      version: 0
    });

    console.log(output);
    /**
     * {
     *   x: '504061',
         y: '22430',
        withoutSlippage: {
          x: '506594',
          y: '22543'
        }
      }
    * */
  })
  ```
</details>

<details>
  <summary>Create Burn Liquidity payload</summary>

  ```typescript
  (async() => {
    const output = await sdk.Liquidity.createBurnLiquidityPayload({
      fromToken: "0x1::aptos_coin::AptosCoin",
      toToken: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
      slippage: 0.005,
      curveType: 'uncorrelated',
      burnAmount: 100000,
      version: 0
    });

    console.log(output);

    /**
     *
     {
       type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::remove_liquidity',
      type_arguments: [
        '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
        '0x1::aptos_coin::AptosCoin',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated'
      ],
      arguments: [ '100000', '22411', '504489' ]
    }
    * */
  })
  ```
</details>

### More examples

More examples you can find in the following directory: [`src/tests/`](src/tests/).

Code examples to work with Aptos SDK can be found in the [examples](examples) directory.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [x] Update to work with the Contract v3
- [x] Prepare transaction payload
- [x] Swap: unstable / stable (normal and high gas)
- [x] Liquidity: add / redeem LP
- [x] Pools: check pool / create pool
- [x] Examples with Aptos SDK
- [ ] Staking: stake / harvest / unstake
- [ ] Concentrated Liquidity: swap, add, burn

See the [open issues](https://github.com/pontem-network/liquidswap-sdk/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- LICENSE -->
## License

Distributed under the GPL v3 License. See [`LICENSE`](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/pontem-network/liquidswap-sdk.svg?style=for-the-badge
[contributors-url]: https://github.com/pontem-network/liquidswap-sdk/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/pontem-network/liquidswap-sdk.svg?style=for-the-badge
[forks-url]: https://github.com/pontem-network/liquidswap-sdk/network/members
[stars-shield]: https://img.shields.io/github/stars/pontem-network/liquidswap-sdk.svg?style=for-the-badge
[stars-url]: https://github.com/pontem-network/liquidswap-sdk/stargazers
[issues-shield]: https://img.shields.io/github/issues/pontem-network/liquidswap-sdk.svg?style=for-the-badge
[issues-url]: https://github.com/pontem-network/liquidswap-sdk/issues
[license-shield]: https://img.shields.io/github/license/pontem-network/liquidswap-sdk.svg?style=for-the-badge
[license-url]: https://github.com/pontem-network/liquidswap-sdk/blob/master/LICENSE
