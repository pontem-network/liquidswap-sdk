import { MODULES_ACCOUNT, RESOURCES_ACCOUNT, TOKENS_MAPPING } from '../constants';
import SDK from '../main';
import { convertValueToDecimal } from '../utils';


describe('Swap Module', () => {
  const sdk = new SDK({
    nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    networkOptions: {
      resourceAccount: RESOURCES_ACCOUNT,
      moduleAccount: MODULES_ACCOUNT
    }
  });

  const curves = sdk.curves;

  test('calculateRates (from mode)', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDT,
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
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDT,
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
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.WETH,
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
        fromToken: TOKENS_MAPPING.BTC,
        toToken: TOKENS_MAPPING.WETH,
        amount: 100000000, // 1 WETH
        curveType: 'stable',
        interactiveToken: 'to',
      });
    } catch (e) {
      expect(e).toMatchObject(
        new Error(
          `LiquidityPool (0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::liquidity_pool::LiquidityPool<${TOKENS_MAPPING.BTC},${TOKENS_MAPPING.WETH},${curves.stable}>) not found`,
        ),
      );
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TOKENS_MAPPING.APTOS + '0',
        toToken: TOKENS_MAPPING.WETH,
        amount: 100000000, // 1 WETH
        curveType: 'stable',
        interactiveToken: 'to',
      });
    } catch (e) {
      expect(e).toMatchObject(new Error('From Coin not exists'));
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TOKENS_MAPPING.APTOS,
        toToken: TOKENS_MAPPING.WETH + '0',
        amount: 100000000, // 1 WETH
        curveType: 'stable',
        interactiveToken: 'to',
      });
    } catch (e) {
      expect(e).toMatchObject(new Error('To Coin not exists'));
    }

    try {
      await sdk.Swap.calculateRates({
        fromToken: TOKENS_MAPPING.APTOS,
        toToken: TOKENS_MAPPING.WETH,
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
        fromToken: TOKENS_MAPPING.APTOS,
        toToken: TOKENS_MAPPING.WETH,
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
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDT,
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
        TOKENS_MAPPING.APTOS,
        TOKENS_MAPPING.USDT,
        curves.uncorrelated,
      ],
      arguments: ['100000000', '4283115'],
    });
  });

  test('createSwapTransactionPayload (uncorrelated to mode high)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDT,
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
        TOKENS_MAPPING.APTOS,
        TOKENS_MAPPING.USDT,
        curves.uncorrelated,
      ],
      arguments: ['23327874', '1000000'],
    });
  });

  test('createSwapTransactionPayload (stable from mode high)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.WETH,
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
      type_arguments: [TOKENS_MAPPING.APTOS, TOKENS_MAPPING.WETH, curves.stable],
      arguments: ['4000000', '37818'],
    });
  });

  test('createSwapTransactionPayload (stable to mode high)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.WETH,
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
      type_arguments: [TOKENS_MAPPING.APTOS, TOKENS_MAPPING.WETH, curves.stable],
      arguments: ['3998981', '37810'],
    });
  });

  test('createSwapTransactionPayload (stable from mode normal)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.WETH,
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
      type_arguments: [TOKENS_MAPPING.APTOS, TOKENS_MAPPING.WETH, curves.stable],
      arguments: ['100000000', '175257'],
    });
  });

  test('createSwapTransactionPayload (stable to mode normal)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.WETH,
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
      type_arguments: [TOKENS_MAPPING.APTOS, TOKENS_MAPPING.WETH, curves.stable],
      arguments: ['400045', '4339'],
    });
  });

  test('createSwapTransactionPayload Errors', () => {
    expect.assertions(2);
    try {
      sdk.Swap.createSwapTransactionPayload({
        fromToken: TOKENS_MAPPING.APTOS,
        toToken: TOKENS_MAPPING.WETH,
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
        fromToken: TOKENS_MAPPING.APTOS,
        toToken: TOKENS_MAPPING.WETH,
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
  test('getAmountIn', async () => {
    const output = await sdk.Swap.getAmountIn({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDT,
      amount: 100000000, // 1 APTOS
      curveType: 'uncorrelated',
    });

    console.log(`100000000 APT → ${output} USDT`);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });
  test('getAmountOut', async () => {
    const output = await sdk.Swap.getAmountOut({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDT,
      amount: 1000000, // 1 USDT
      curveType: 'uncorrelated',
    });

    console.log(`${output} APT → 1000000 USDT`);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  })
});
