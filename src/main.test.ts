import SDK from './main'
import { d, decimalsMultiplier } from "./utils";

const TokensMapping: Record<string, string> = {
  APTOS: '0x1::aptos_coin::AptosCoin',
  USDT: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT', //layerzero
  BTC: '0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T', // wormhole wrapped BTC
  WETH: '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T' // wormhole WETH
};

const CoinInfo: Record<string, { decimals: number }> = {
  APTOS: { decimals: 8 },
  USDT: { decimals: 6 },
  BTC: { decimals: 8 },
  WETH: { decimals: 8 }
}

function convertToDecimals(amount: number | string, token: string) {
  const mul = decimalsMultiplier(CoinInfo[token]?.decimals || 0);

  return d(amount).mul(mul)
}

function prettyAmount(amount: number | string, token: string) {
  const mul = decimalsMultiplier(CoinInfo[token]?.decimals || 0);

  return d(amount).div(mul)
}

describe('Swap Module', () => {
  const sdk = new SDK({
    nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
  })
  test('calculateRates (from mode)', async () => {
    console.log({amountIn: convertToDecimals(1, 'APTOS')});
    const output = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      amount: convertToDecimals(1, 'APTOS'),
      curveType: 'uncorrelated',
      interactiveToken: 'from',
    })

    console.log({
      amount: output,
      pretty: prettyAmount(output, 'USDT'),
    });

    expect(1).toBe(1)
  });

  test('calculateRates (to mode)', async () => {
    console.log({amountInToMode: convertToDecimals(1, 'USDT')});
    const output = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      amount: convertToDecimals('1', 'USDT'),
      curveType: 'uncorrelated',
      interactiveToken: 'to',
    })

    console.log({
      amount: output,
      pretty: prettyAmount(output, 'APTOS'),
    });

    expect(1).toBe(1)
  });

  test('calculateRates (from mode stable)', async () => {
    console.log({amountIn: convertToDecimals(1, 'APTOS')});
    const output = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.WETH,
      amount: convertToDecimals('1', 'APTOS'),
      curveType: 'stable',
      interactiveToken: 'from',
    })

    console.log({
      amount: output,
      pretty: prettyAmount(output, 'WETH'),
    });

    expect(1).toBe(1);
  });

  test('calculateRates (to mode stable) Errors',  async () => {
    expect.assertions(5);

    try {
      await sdk.Swap.calculateRates({
        fromToken: TokensMapping.BTC,
        toToken: TokensMapping.WETH,
        amount: convertToDecimals('1', 'WETH'),
        curveType: 'stable',
        interactiveToken: 'to',
      })
    } catch(e) {
      expect(e).toMatchObject(new Error(`LiquidityPool (0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::liquidity_pool::LiquidityPool<${TokensMapping.BTC},${TokensMapping.WETH},0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable>) not found`));
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TokensMapping.APTOS + '0',
        toToken: TokensMapping.WETH,
        amount: convertToDecimals('1', 'WETH'),
        curveType: 'stable',
        interactiveToken: 'to',
      })
    } catch(e) {
      expect(e).toMatchObject(new Error('From Coin not exists'));
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TokensMapping.APTOS,
        toToken: TokensMapping.WETH + '0',
        amount: convertToDecimals('1', 'WETH'),
        curveType: 'stable',
        interactiveToken: 'to',
      })
    } catch(e) {
      expect(e).toMatchObject(new Error('To Coin not exists'));
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TokensMapping.APTOS,
        toToken: TokensMapping.WETH,
        amount: convertToDecimals('1', 'WETH'),
        curveType: 'stable',
        interactiveToken: 'to',
      })
    } catch(e) {
      expect(e).toMatchObject(new Error('Insufficient funds in Liquidity Pool'));
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TokensMapping.APTOS,
        toToken: TokensMapping.WETH,
        amount: convertToDecimals('0', 'WETH'),
        curveType: 'stable',
        interactiveToken: 'to',
      })
    } catch(e) {
      expect(e).toMatchObject(new Error('Amount equals zero or undefined'));
    }
  });

  test('createSwapTransactionPayload (uncorrelated from mode high)', async () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.BTC,
      fromAmount: convertToDecimals('1', 'APTOS'),
      toAmount: convertToDecimals('4.995851', 'USDT'),
      interactiveToken: 'from',
      slippage: d(0.05),
      stableSwapType: 'high',
      curveType: 'uncorrelated',
    })

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated'
      ],
      arguments: ['100000000', '4746058']
    })
  })

  test('createSwapTransactionPayload (uncorrelated to mode high)', async () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.BTC,
      fromAmount: convertToDecimals('1', 'APTOS'),
      toAmount: convertToDecimals('4.995851', 'USDT'),
      interactiveToken: 'to',
      slippage: d(0.05),
      stableSwapType: 'high',
      curveType: 'uncorrelated',
    })

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_into',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated'
      ],
      arguments: ['105000000', '4995851']
    })
  });

  test('createSwapTransactionPayload (stable from mode high)', async () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.WETH,
      fromAmount: convertToDecimals('1', 'APTOS'),
      toAmount: convertToDecimals('0.000846', 'WETH'),
      interactiveToken: 'from',
      slippage: d(0.05),
      stableSwapType: 'high',
      curveType: 'stable',
    })

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable'
      ],
      arguments: ['100000000', '80370']
    })
  });

  test('createSwapTransactionPayload (stable to mode high)', async () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.WETH,
      fromAmount: convertToDecimals('1', 'APTOS'),
      toAmount: convertToDecimals('0.000846', 'WETH'),
      interactiveToken: 'to',
      slippage: d(0.05),
      stableSwapType: 'high',
      curveType: 'stable',
    })

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_into',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable'
      ],
      arguments: ['105000000', '84600']
    });
  });

  test('createSwapTransactionPayload (stable from mode normal)', async () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.WETH,
      fromAmount: convertToDecimals('1', 'APTOS'),
      toAmount: convertToDecimals('0.000846', 'WETH'),
      interactiveToken: 'from',
      slippage: d(0.05),
      stableSwapType: 'normal',
      curveType: 'stable',
    })

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_unchecked',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable'
      ],
      arguments: ['100000000', '80370']
    })
  });

  test('createSwapTransactionPayload (stable to mode normal)', async () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.WETH,
      fromAmount: convertToDecimals('1', 'APTOS'),
      toAmount: convertToDecimals('0.000846', 'WETH'),
      interactiveToken: 'to',
      slippage: d(0.05),
      stableSwapType: 'normal',
      curveType: 'stable',
    })

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_unchecked',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T',
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Stable'
      ],
      arguments: ['105000000', '84600']
    })
  });

  test('createSwapTransactionPayload Errors',  () => {
    expect.assertions(2);

    try {
      sdk.Swap.createSwapTransactionPayload({
        fromToken: TokensMapping.APTOS,
        toToken: TokensMapping.WETH,
        fromAmount: convertToDecimals('1', 'APTOS'),
        toAmount: convertToDecimals('0.000846', 'WETH'),
        interactiveToken: 'to',
        slippage: d(-0.01),
        stableSwapType: 'high',
        curveType: 'stable',
      })
    } catch(e) {
      expect(e).toMatchObject(new Error(`Invalid slippage (-0.01) value`));
    }

    try {
      sdk.Swap.createSwapTransactionPayload({
        fromToken: TokensMapping.APTOS,
        toToken: TokensMapping.WETH,
        fromAmount: convertToDecimals('1', 'APTOS'),
        toAmount: convertToDecimals('0.000846', 'WETH'),
        interactiveToken: 'to',
        slippage: d(1.01),
        stableSwapType: 'high',
        curveType: 'stable',
      })
    } catch(e) {
      expect(e).toMatchObject(new Error(`Invalid slippage (1.01) value`));
    }
  });
})
