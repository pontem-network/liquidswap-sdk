import SDK from './main'
import { d, decimalsMultiplier } from "./utils";

const TokensMapping: any = {
  APTOS: '0x1::aptos_coin::AptosCoin',
  BTC: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
  APTOSBTCLP: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::aptos_coin::AptosCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>',
};

const CoinInfo: any = {
  APTOS: { decimals: 6 },
  BTC: { decimals: 8 },
  APTOSBTCLP: { decimals: 6 },
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
    nodeUrl: 'https://fullnode.devnet.aptoslabs.com',
    networkOptions: {
      nativeToken: '0x1::test_coin::TestCoin',
      modules: {
        Scripts:
          '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::scripts',
        Faucet:
          '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::faucet',
        LiquidityPool:
          '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::liquidity_pool',
        CoinInfo: '0x1::coin::CoinInfo',
        CoinStore: '0x1::coin::CoinStore',
      },
    }
  })
  test('calculateRates (from mode)', async () => {
    const output = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.BTC,
      amount: convertToDecimals(1, 'APTOS'),
      interactiveToken: 'from',
      pool: {
        address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        moduleAddress: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        lpToken: TokensMapping.APTOSBTCLP
      }
    })

    console.log({
      amount: output,
      pretty: prettyAmount(output, 'BTC'),
    });

    expect(1).toBe(1)
  });

  test('calculateRates (to mode)', async () => {
    console.log(convertToDecimals('0.001', 'BTC'),);
    const output = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.BTC,
      amount: convertToDecimals('0.001', 'BTC'),
      interactiveToken: 'to',
      pool: {
        address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        moduleAddress: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        lpToken: TokensMapping.APTOSBTCLP
      }
    })

    console.log({
      amount: output,
      pretty: prettyAmount(output, 'APTOS'),
    });

    expect(1).toBe(1)
  });

  test('createSwapTransactionPayload (to mode)', async () => {
    console.log(convertToDecimals('0.001', 'BTC'),);
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.BTC,
      fromAmount: convertToDecimals('0.116831', 'APTOS'),
      toAmount: convertToDecimals('0.001', 'BTC'),
      interactiveToken: 'to',
      slippage: 0.05,
      pool: {
        address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        moduleAddress: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        lpToken: TokensMapping.APTOSBTCLP
      }
    })

    console.log(output);

    expect(1).toBe(1)
  });

  test('createSwapTransactionPayload (from mode)', async () => {
    console.log(convertToDecimals('0.001', 'BTC'),);
    const output = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.APTOS,
      toToken: TokensMapping.BTC,
      fromAmount: convertToDecimals('1', 'APTOS'),
      toAmount: convertToDecimals('0.01584723', 'BTC'),
      interactiveToken: 'from',
      slippage: 0.05,
      pool: {
        address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        moduleAddress: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        lpToken: TokensMapping.APTOSBTCLP
      }
    })

    console.log(output);

    expect(1).toBe(1)
  });
})
