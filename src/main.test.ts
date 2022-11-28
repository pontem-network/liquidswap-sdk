import { CURVE_UNCORRELATED, CURVE_STABLE } from './constants';
import SDK from './main';
import { convertValueToDecimal } from './utils';

const TokensMapping: Record<string, string> = {
  APTOS: '0x1::aptos_coin::AptosCoin',
  USDT: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT', //layerzero USDT
  BTC: '0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T', // wormhole wrapped BTC
  WETH: '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T', // wormhole WETH
  USDC: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC', // layerzero USDC
};

/**
 * TESTS FOR SWAP MODULE
 *  */

describe('Swap Module', () => {
  const sdk = new SDK({
    nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
  });
  test('calculateRates (from mode)', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      amount: 100000000, // 1 APTOS
      curveType: 'uncorrelated',
      interactiveToken: 'from',
    });

    console.log(`100000000 APT → ${output} USDT`);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('calculateRates (to mode)', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      amount: 1000000, // 1 USDT
      curveType: 'uncorrelated',
      interactiveToken: 'to',
    });

    console.log(`${output} APT → 1000000 USDT`);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('calculateRates (from mode stable)', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.WETH,
      amount: 100000000, // 1 APTOS
      curveType: 'stable',
      interactiveToken: 'from',
    });

    console.log(`100000000 APT → ${output} WETH`);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('calculateRates (to mode stable) and get error', async () => {
    try {
      await sdk.Swap.calculateRates({
        fromToken: TokensMapping.BTC,
        toToken: TokensMapping.WETH,
        amount: 100000000, // 1 WETH
        curveType: 'stable',
        interactiveToken: 'to',
      });
    } catch (e) {
      expect(e).toMatchObject(
        new Error(
          `LiquidityPool (0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::liquidity_pool::LiquidityPool<${TokensMapping.BTC},${TokensMapping.WETH},${CURVE_STABLE}>) not found`,
        ),
      );
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TokensMapping.APTOS + '0',
        toToken: TokensMapping.WETH,
        amount: 100000000, // 1 WETH
        curveType: 'stable',
        interactiveToken: 'to',
      });
    } catch (e) {
      expect(e).toMatchObject(new Error('From Coin not exists'));
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TokensMapping.APTOS,
        toToken: TokensMapping.WETH + '0',
        amount: 100000000, // 1 WETH
        curveType: 'stable',
        interactiveToken: 'to',
      });
    } catch (e) {
      expect(e).toMatchObject(new Error('To Coin not exists'));
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TokensMapping.APTOS,
        toToken: TokensMapping.WETH,
        amount: 100000000, // 1 WETH
        curveType: 'stable',
        interactiveToken: 'to',
      });
    } catch (e) {
      expect(e).toMatchObject(
        new Error('Insufficient funds in Liquidity Pool'),
      );
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TokensMapping.APTOS,
        toToken: TokensMapping.WETH,
        amount: 0, // 0 WETH
        curveType: 'stable',
        interactiveToken: 'to',
      });
    } catch (e) {
      expect(e).toMatchObject(new Error('Amount equals zero or undefined'));
    }
  });

  test('createSwapTransactionPayload (uncorrelated from mode high)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      fromAmount: 100000000, // 1 APTOS
      toAmount: 4304638, // 4.304638 USDT
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'high',
      curveType: 'uncorrelated',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap',
      type_arguments: [
        TokensMapping.APTOS,
        TokensMapping.USDT,
        CURVE_UNCORRELATED,
      ],
      arguments: ['100000000', '4283115'],
    });
  });

  test('createSwapTransactionPayload (uncorrelated to mode high)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      fromAmount: 23211815, // 0.23211815 APTOS
      toAmount: 1000000, // 1 USDT
      interactiveToken: 'to',
      slippage: 0.005,
      stableSwapType: 'high',
      curveType: 'uncorrelated',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_into',
      type_arguments: [
        TokensMapping.APTOS,
        TokensMapping.USDT,
        CURVE_UNCORRELATED,
      ],
      arguments: ['23327874', '1000000'],
    });
  });

  test('createSwapTransactionPayload (stable from mode high)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.WETH,
      fromAmount: 4000000, // 0.04 APTOS
      toAmount: 37818, // 0.00037818 WETH
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'high',
      curveType: 'stable',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap',
      type_arguments: [TokensMapping.APTOS, TokensMapping.WETH, CURVE_STABLE],
      arguments: ['4000000', '37629'],
    });
  });

  test('createSwapTransactionPayload (stable to mode high)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.WETH,
      fromAmount: convertValueToDecimal('0.03998981', 8),
      toAmount: convertValueToDecimal('0.0003781', 8),
      interactiveToken: 'to',
      slippage: 0.005,
      stableSwapType: 'high',
      curveType: 'stable',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_into',
      type_arguments: [TokensMapping.APTOS, TokensMapping.WETH, CURVE_STABLE],
      arguments: ['4018976', '37810'],
    });
  });

  test('createSwapTransactionPayload (stable from mode normal)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.WETH,
      fromAmount: convertValueToDecimal('1', 8),
      toAmount: convertValueToDecimal('0.00175257', 8),
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'stable',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_unchecked',
      type_arguments: [TokensMapping.APTOS, TokensMapping.WETH, CURVE_STABLE],
      arguments: ['100000000', '174381'],
    });
  });

  test('createSwapTransactionPayload (stable to mode normal)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.WETH,
      fromAmount: convertValueToDecimal('0.00400045', 8),
      toAmount: convertValueToDecimal('0.00004339', 8),
      interactiveToken: 'to',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'stable',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_unchecked',
      type_arguments: [TokensMapping.APTOS, TokensMapping.WETH, CURVE_STABLE],
      arguments: ['402045', '4339'],
    });
  });

  test('createSwapTransactionPayload Errors', () => {
    expect.assertions(2);
    try {
      sdk.Swap.createSwapTransactionPayload({
        fromToken: TokensMapping.APTOS,
        toToken: TokensMapping.WETH,
        fromAmount: convertValueToDecimal('1', 8),
        toAmount: convertValueToDecimal('0.000846', 8),
        interactiveToken: 'to',
        slippage: -0.01,
        stableSwapType: 'high',
        curveType: 'stable',
      });
    } catch (e) {
      expect(e).toMatchObject(
        new Error(`Invalid slippage (-0.01) value, it should be from 0 to 1`),
      );
    }

    try {
      sdk.Swap.createSwapTransactionPayload({
        fromToken: TokensMapping.APTOS,
        toToken: TokensMapping.WETH,
        fromAmount: convertValueToDecimal('1', 8),
        toAmount: convertValueToDecimal('0.000846', 8),
        interactiveToken: 'to',
        slippage: 1.01,
        stableSwapType: 'high',
        curveType: 'stable',
      });
    } catch (e) {
      expect(e).toMatchObject(
        new Error(`Invalid slippage (1.01) value, it should be from 0 to 1`),
      );
    }
  });
  test('calculateLiquidityRates (from mode), uncorrelated', async () => {
    const output = await sdk.Liquidity.calculateRateAndMinReceivedLP({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDC,
      amount: 100000000, // 1 APTOS
      curveType: 'uncorrelated',
      interactiveToken: 'from',
      slippage: 0.005,
    });

    console.log(
      `100000000 APT → ${output.rate} USDC && receiveLp ${output.receiveLp}`,
    );

    expect(typeof output).toBe('object');
    expect(output.rate.length).toBeGreaterThan(0);
  });

  /**
   * TESTS FOR LIQUIDITY MODULE
   *  */

  test('calculateLiquidityRates (to mode), uncorrelated', async () => {
    const output = await sdk.Liquidity.calculateRateAndMinReceivedLP({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDC,
      amount: 1000000, // 1 USDC
      curveType: 'uncorrelated',
      interactiveToken: 'to',
      slippage: 0.005,
    });

    console.log(
      `1000000 USDC → ${output.rate} APT && receiveLp ${output.receiveLp}`,
    );

    expect(typeof output).toBe('object');
    expect(output.rate.length).toBeGreaterThan(0);
  });

  test('calculateLiquidityRates (from mode), stable', async () => {
    const output = await sdk.Liquidity.calculateRateAndMinReceivedLP({
      fromToken: TokensMapping.USDC,
      toToken: TokensMapping.USDT,
      amount: 2000000, // 2 USDC
      curveType: 'stable',
      interactiveToken: 'from',
      slippage: 0.005,
    });

    console.log(
      `2000000 USDC → ${output.rate} USDT && receiveLp ${output.receiveLp}`,
    );

    expect(typeof output).toBe('object');
    expect(output.rate.length).toBeGreaterThan(0);
  });

  test('calculateLiquidityRates (to mode), stable', async () => {
    const output = await sdk.Liquidity.calculateRateAndMinReceivedLP({
      fromToken: TokensMapping.USDC,
      toToken: TokensMapping.USDT,
      amount: 2000000, // 2 USDT
      curveType: 'stable',
      interactiveToken: 'to',
      slippage: 0.005,
    });

    console.log(
      `2000000 USDT → ${output.rate} USDC && receiveLp ${output.receiveLp}`,
    );

    expect(typeof output).toBe('object');
    expect(output.rate.length).toBeGreaterThan(0);
  });

  test('createAddLiquidityPayload (uncorrelated from mode)', async () => {
    const output = await sdk.Liquidity.createAddLiquidityPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDC,
      fromAmount: 400, // 0.000004 APTOS
      toAmount: 19, // 0.000019 USDC
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'uncorrelated',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::add_liquidity',
      type_arguments: [
        TokensMapping.USDC,
        TokensMapping.APTOS,
        CURVE_UNCORRELATED,
      ],
      arguments: ['19', '19', '400', '398'],
    });
  });

  test('createAddLiquidityPayload (uncorrelated to mode)', async () => {
    const output = await sdk.Liquidity.createAddLiquidityPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDC,
      fromAmount: 22335, // 0.00022335 APTOS
      toAmount: 1000, // 0.001 USDC
      interactiveToken: 'to',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'uncorrelated',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::add_liquidity',
      type_arguments: [
        TokensMapping.USDC,
        TokensMapping.APTOS,
        CURVE_UNCORRELATED,
      ],
      arguments: ['1000', '995', '22335', '22223'],
    });
  });

  test('createAddLiquidityPayload (uncorrelated from mode)', async () => {
    const output = await sdk.Liquidity.createAddLiquidityPayload({
      fromToken:
        '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::celer_coin_manager::UsdcCoin',
      toToken:
        '0x881ac202b1f1e6ad4efcff7a1d0579411533f2502417a19211cfc49751ddb5f4::coin::MOJO',
      fromAmount: 1000, // 0.001 clUSDC
      toAmount: 100000, // 0.001 MOJO
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'uncorrelated',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::register_pool_and_add_liquidity',
      type_arguments: [
        '0x881ac202b1f1e6ad4efcff7a1d0579411533f2502417a19211cfc49751ddb5f4::coin::MOJO',
        '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::celer_coin_manager::UsdcCoin',
        CURVE_UNCORRELATED,
      ],
      arguments: ['100000', '99500', '1000', '995'],
    });
  });

  test('createBurnLiquidityPayload (uncorrelated)', async () => {
    const output = await sdk.Liquidity.createBurnLiquidityPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDC,
      slippage: 0.005,
      curveType: 'uncorrelated',
      burnAmount: 100000,
    });

    console.log('createBurnLiquidityPayload', output);

    expect(output).toEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::remove_liquidity',
      type_arguments: [
        TokensMapping.USDC,
        TokensMapping.APTOS,
        CURVE_UNCORRELATED,
      ],
      arguments: ['100000', expect.any(String), expect.any(String)],
    });
  });

  test('calculateOutputBurn', async () => {
    const output = await sdk.Liquidity.calculateOutputBurn({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDC,
      slippage: 0.005,
      curveType: 'uncorrelated',
      burnAmount: 100000,
    });

    expect(output).toEqual({
      x: expect.any(String),
      y: expect.any(String),
      withoutSlippage: {
        x: expect.any(String),
        y: expect.any(String),
      },
    });
  });

  test('Check Pool Existence ', async () => {
    const output = await sdk.Liquidity.checkPoolExistence({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDC,
      curveType: 'uncorrelated',
    });

    expect(output).toEqual(true);
  });
  test('Check Pool Existence ', async () => {
    const output = await sdk.Liquidity.checkPoolExistence({
      fromToken:
        '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::celer_coin_manager::UsdcCoin',
      toToken:
        '0x881ac202b1f1e6ad4efcff7a1d0579411533f2502417a19211cfc49751ddb5f4::coin::MOJO',
      curveType: 'uncorrelated',
    });

    expect(output).toEqual(false);
  });
});
