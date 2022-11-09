import SDK from './main'
import { d, decimalsMultiplier } from "./utils";
import {NETWORKS_MODULES} from "./constants";

const TokensMapping: Record<string, string> = {
  APTOS: '0x1::aptos_coin::AptosCoin',
  USDT: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::USDT',
  APTOSUSDTLP: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp_coin::LP<0x1::aptos_coin::AptosCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::USDT>',
};

const CoinInfo: Record<string, { decimals: number }> = {
  APTOS: { decimals: 6 },
  APTOSBTCLP: { decimals: 6 },
  USDT: {decimals: 6}
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
    nodeUrl: 'https://aptos-testnet.pontem.network/v1',
    networkOptions: {
      nativeToken: '0x1::aptos_coin::AptosCoin',
      modules: {
        Scripts: NETWORKS_MODULES.Scripts,
        Faucet: NETWORKS_MODULES.Faucet,
        LiquidityPool: NETWORKS_MODULES.LiquidityPool,
        CoinInfo: NETWORKS_MODULES.CoinInfo,
        CoinStore: NETWORKS_MODULES.CoinStore,
      },
    }
  })
  test('calculateRates (from mode)', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      amount: convertToDecimals(1, 'APTOS'),
      curveType: 'stable',
      interactiveToken: 'from',
    })

    console.log({
      amount: output,
      pretty: prettyAmount(output, 'USDT'),
    });

    expect(1).toBe(1)
  });

  test('calculateRates (to mode)', async () => {
    console.log(convertToDecimals('0.001', 'USDT'),);
    const output = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.USDT,
      amount: convertToDecimals('0.001', 'USDT'),
      curveType: 'uncorrelated',
      interactiveToken: 'to',
    })

    console.log({
      amount: output,
      pretty: prettyAmount(output, 'APTOS'),
    });

    expect(1).toBe(1)
  });

  // test('createSwapTransactionPayload (to mode)', async () => {
  //   console.log(convertToDecimals('0.001', 'USDT'),);
  //   const output = sdk.Swap.createSwapTransactionPayload({
  //     fromToken: TokensMapping.APTOS,
  //     toToken: TokensMapping.USDT,
  //     fromAmount: convertToDecimals('0.116831', 'APTOS'),
  //     toAmount: convertToDecimals('0.001', 'USDT'),
  //     interactiveToken: 'to',
  //     slippage: d(0.05),
  //     stableSwapType: 'normal',
  //     curveType: 'stable',
  //   })
  //
  //   console.log(output);
  //
  //   expect(1).toBe(1)
  // });
  //
  // test('createSwapTransactionPayload (from mode)', async () => {
  //   console.log(convertToDecimals('0.001', 'USDT'),);
  //   const output = sdk.Swap.createSwapTransactionPayload({
  //     fromToken: TokensMapping.APTOS,
  //     toToken: TokensMapping.USDT,
  //     fromAmount: convertToDecimals('1', 'APTOS'),
  //     toAmount: convertToDecimals('0.01584723', 'USDT'),
  //     interactiveToken: 'from',
  //     slippage: d(0.05),
  //     stableSwapType: 'high',
  //     curveType: 'stable',
  //   })
  //
  //   console.log(output);
  //
  //   expect(1).toBe(1)
  // });
})
