import { MODULES_ACCOUNT, RESOURCES_ACCOUNT, TOKENS_MAPPING } from '../constants';
import SDK from '../main';


describe('Liquidity Module', () => {
  const sdk = new SDK({
    nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    networkOptions: {
      resourceAccount: RESOURCES_ACCOUNT,
      moduleAccount: MODULES_ACCOUNT
    }
  });

  const curves = sdk.curves;

  test('calculateLiquidityRates (from mode), uncorrelated', async () => {
    const output = await sdk.Liquidity.calculateRateAndMinReceivedLP({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDC,
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

  test('calculateLiquidityRates (to mode), uncorrelated', async () => {
    const output = await sdk.Liquidity.calculateRateAndMinReceivedLP({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDC,
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
      fromToken: TOKENS_MAPPING.USDC,
      toToken: TOKENS_MAPPING.USDT,
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
      fromToken: TOKENS_MAPPING.USDC,
      toToken: TOKENS_MAPPING.USDT,
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
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDC,
      fromAmount: 400, // 0.000004 APTOS
      toAmount: 19, // 0.000019 USDC
      interactiveToken: 'from',
      slippage: 0.005,
      curveType: 'uncorrelated',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::add_liquidity',
      type_arguments: [
        TOKENS_MAPPING.USDC,
        TOKENS_MAPPING.APTOS,
        curves.uncorrelated,
      ],
      arguments: ['19', '19', '400', '398'],
    });
  });

  test('createAddLiquidityPayload (uncorrelated to mode)', async () => {
    const output = await sdk.Liquidity.createAddLiquidityPayload({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDC,
      fromAmount: 22335, // 0.00022335 APTOS
      toAmount: 1000, // 0.001 USDC
      interactiveToken: 'to',
      slippage: 0.005,
      curveType: 'uncorrelated',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::add_liquidity',
      type_arguments: [
        TOKENS_MAPPING.USDC,
        TOKENS_MAPPING.APTOS,
        curves.uncorrelated,
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
      curveType: 'uncorrelated',
    });

    expect(output).toStrictEqual({
      type: 'entry_function_payload',
      function:
        '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts_v2::register_pool_and_add_liquidity',
      type_arguments: [
        '0x881ac202b1f1e6ad4efcff7a1d0579411533f2502417a19211cfc49751ddb5f4::coin::MOJO',
        '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::celer_coin_manager::UsdcCoin',
        curves.uncorrelated,
      ],
      arguments: ['100000', '99500', '1000', '995'],
    });
  });

  test('createBurnLiquidityPayload (uncorrelated)', async () => {
    const output = await sdk.Liquidity.createBurnLiquidityPayload({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDC,
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
        TOKENS_MAPPING.USDC,
        TOKENS_MAPPING.APTOS,
        curves.uncorrelated,
      ],
      arguments: ['100000', expect.any(String), expect.any(String)],
    });
  });

  test('calculateOutputBurn', async () => {
    const output = await sdk.Liquidity.calculateOutputBurn({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDC,
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
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDC,
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

  test('getAmountIn', async () => {
    const output = await sdk.Liquidity.getAmountIn({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDC,
      amount: 100000000, // 1 APTOS
      curveType: 'uncorrelated',
      slippage: 0.005,
    });

    console.log(
      `100000000 APT → ${output} USDC`,
    );

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('getAmountOut', async () => {
    const output = await sdk.Liquidity.getAmountOut({
      fromToken: TOKENS_MAPPING.APTOS,
      toToken: TOKENS_MAPPING.USDC,
      amount: 1000000, // 1 USDC
      curveType: 'uncorrelated',
      slippage: 0.005,
    });

    console.log(
      `1000000 USDC → ${output} APT`,
    );

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  })
});
