import {
  MODULES_ACCOUNT,
  MODULES_V05_ACCOUNT,
  RESOURCES_ACCOUNT,
  RESOURCES_V05_ACCOUNT,
  TOKENS_MAPPING,
  VERSION_0,
  VERSION_0_5
} from '../constants';
import SDK from '../main';
import { convertValueToDecimal } from '../utils';


describe('Swap Module', () => {
  const sdk = new SDK({
    nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    networkOptions: {
      resourceAccount: RESOURCES_ACCOUNT,
      moduleAccount: MODULES_ACCOUNT,
      resourceAccountV05: RESOURCES_V05_ACCOUNT,
      moduleAccountV05: MODULES_V05_ACCOUNT
    }
  });

  const curves = sdk.curves;

  test('calculateRates (from mode) stable version v0.5', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TOKENS_MAPPING.USDC,
      toToken: TOKENS_MAPPING.USDT,
      amount: 1000000, // 1 USDC
      curveType: 'stable',
      interactiveToken: 'from',
      version: VERSION_0_5
    });

    console.log(`1000000 LayerZero USDC → ${output} LayerZero USDT`);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('calculateRates (to mode) stable version v0.5', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TOKENS_MAPPING.USDC,
      toToken: TOKENS_MAPPING.USDT,
      amount: 100000, // 0.1 USDT
      curveType: 'stable',
      interactiveToken: 'to',
      version: VERSION_0_5
    });

    console.log(`100000 LayerZero USDT → ${output} LayerZero USDC`);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('calculateRates (from mode) uncorrelated version v0.5', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TOKENS_MAPPING.USDT,
      toToken: TOKENS_MAPPING.WETH,
      amount: 150000, // 0.15 USDT
      curveType: 'uncorrelated',
      interactiveToken: 'from',
      version: VERSION_0_5
    });

    console.log(`150000 LayerZero USDT → ${output} LayerZero WETH`);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('calculateRates (to mode) uncorrelated version v0.5', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TOKENS_MAPPING.WETH,
      toToken: TOKENS_MAPPING.USDT,
      amount: 150000, // 0.15 USDT
      curveType: 'uncorrelated',
      interactiveToken: 'to',
      version: VERSION_0_5
    });

    console.log(`150000 LayerZero USDT → ${output} LayerZero WETH`);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('createSwapTransactionPayload (stable from mode high) v0.5', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TOKENS_MAPPING.USDT,
      toToken: TOKENS_MAPPING.WETH,
      fromAmount: 150000, // 0.15 layerzero USDT
      toAmount: 146, // 0.0000146 wormhole WETH
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'high',
      curveType: 'stable',
      version: VERSION_0_5
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e::scripts::swap',
      type_arguments: [TOKENS_MAPPING.USDT, TOKENS_MAPPING.WETH, curves.stableV05],
      arguments: ['150000', '145'],
    });
  });

  test('createSwapTransactionPayload (stable from mode high) v0.5', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TOKENS_MAPPING.USDT,
      toToken: TOKENS_MAPPING.WETH,
      fromAmount: 150000, // 0.15 layerzero USDT
      toAmount: 146, // 0.0000146 wormhole WETH
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'stable',
      version: VERSION_0_5
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e::scripts::swap',
      type_arguments: [TOKENS_MAPPING.USDT, TOKENS_MAPPING.WETH, curves.stableV05],
      arguments: ['150000', '145'],
    });
  });

  test('calculateRates (from mode)', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDT,
      amount: 100000000, // 1 APTOS
      curveType: 'uncorrelated',
      interactiveToken: 'from',
      version: VERSION_0
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
      version: VERSION_0
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
      version: VERSION_0
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
        version: VERSION_0
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
        version: VERSION_0
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
        version: VERSION_0
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
        version: VERSION_0
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
        version: VERSION_0
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
      version: VERSION_0
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
      version: VERSION_0
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
      fromToken: TOKENS_MAPPING.USDT,
      toToken: TOKENS_MAPPING.WETH,
      fromAmount: 150000, // 0.15 USDT
      toAmount: 91, // 0.000091WETH
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'high',
      curveType: 'stable',
      version: VERSION_0
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap',
      type_arguments: [TOKENS_MAPPING.USDT, TOKENS_MAPPING.WETH, curves.stable],
      arguments: ['150000', '90'],
    });
  });

  test('createSwapTransactionPayload (stable to mode high)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TOKENS_MAPPING.USDT,
      toToken: TOKENS_MAPPING.WETH,
      fromAmount: convertValueToDecimal('0.097835', 6),
      toAmount: convertValueToDecimal('0.00006', 6),
      interactiveToken: 'to',
      slippage: 0.005,
      stableSwapType: 'high',
      curveType: 'stable',
      version: VERSION_0
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_into',
      type_arguments: [TOKENS_MAPPING.USDT, TOKENS_MAPPING.WETH, curves.stable],
      arguments: ['97835', '60'],
    });
  });

  test('createSwapTransactionPayload (stable from mode normal)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TOKENS_MAPPING.USDT,
      toToken: TOKENS_MAPPING.WETH,
      fromAmount: convertValueToDecimal('0.1', 6),
      toAmount: convertValueToDecimal('0.00006', 6),
      interactiveToken: 'from',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'stable',
      version: VERSION_0
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_unchecked',
      type_arguments: [TOKENS_MAPPING.USDT, TOKENS_MAPPING.WETH, curves.stable],
      arguments: ['100000', '59'],
    });
  });

  test('createSwapTransactionPayload (stable to mode normal)', () => {
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TOKENS_MAPPING.USDT,
      toToken: TOKENS_MAPPING.WETH,
      fromAmount: convertValueToDecimal('0.081473', 6),
      toAmount: convertValueToDecimal('0.00005', 6),
      interactiveToken: 'to',
      slippage: 0.005,
      stableSwapType: 'normal',
      curveType: 'stable',
      version: VERSION_0
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::swap_unchecked',
      type_arguments: [TOKENS_MAPPING.USDT, TOKENS_MAPPING.WETH, curves.stable],
      arguments: ['81473', '50'],
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
        version: VERSION_0
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
        version: VERSION_0
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
      version: VERSION_0
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
      version: VERSION_0
    });

    console.log(`${output} APT → 1000000 USDT`);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  })
});
