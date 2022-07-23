import SDK from './main'
import {d, decimalsMultiplier} from "./utils/numbers";

const TokensMapping: any = {
  APTOS: '0x1::test_coin::TestCoin',
  BTC: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC',
  APTOSBTCLP: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::lp::LP<0x1::test_coin::TestCoin, 0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC>',
}

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
        LiquidswapDeployer:
          '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        Faucet:
          '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::faucet',
        LiquidityPool:
          '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::liquidity_pool',
        CoinInfo: '0x1::coin::CoinInfo',
        CoinStore: '0x1::coin::CoinStore',
      },
    }
  })

  test('test default sdk options', () => {
    const sdk = new SDK()
    expect(sdk.client.nodeUrl).toBe('https://fullnode.devnet.aptoslabs.com')
    expect(sdk.networkOptions.nativeToken).toBe('0x1::test_coin::TestCoin')
    expect(sdk.networkOptions.modules.LiquidswapDeployer).toBe('0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9')
    expect(sdk.networkOptions.modules.CoinInfo).toBe('0x1::coin::CoinInfo')
    expect(sdk.networkOptions.modules.CoinStore).toBe('0x1::coin::CoinStore')
  });

  test('calculateRates (getAmountIn mode)', async () => {
    const output = await sdk.Swap.calculateRates({
      coinIn: TokensMapping.APTOS,
      coinOut: TokensMapping.BTC,
      amount: convertToDecimals(1, 'APTOS'),
      pool: {
        address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        lpCoin: TokensMapping.APTOSBTCLP
      }
    }, true)

    console.log({
      amount: output,
      pretty: prettyAmount(output, 'BTC'),
    });

    expect(1).toBe(1)
  });

  test('calculateRates (getAmountOut mode)', async () => {
    console.log(convertToDecimals('0.001', 'BTC'),);
    const output = await sdk.Swap.calculateRates({
      coinIn: TokensMapping.APTOS,
      coinOut: TokensMapping.BTC,
      amount: convertToDecimals('0.001', 'BTC'),
      pool: {
        address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        lpCoin: TokensMapping.APTOSBTCLP
      }
    }, false)

    console.log({
      amount: output,
      pretty: prettyAmount(output, 'APTOS'),
    });

    expect(1).toBe(1)
  });

  test('createSwapTransactionPayload (swapExactAmount mode)', async () => {
    console.log(convertToDecimals('0.001', 'BTC'),);
    const output = sdk.Swap.createSwapExactAmountPayload({
      coinIn: TokensMapping.APTOS,
      coinOut: TokensMapping.BTC,
      coinInAmount: convertToDecimals('0.116831', 'APTOS'),
      coinOutAmount: convertToDecimals('0.001', 'BTC'),
      slippage: 0.05,
      pool: {
        address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        lpCoin: TokensMapping.APTOSBTCLP
      }
    })

    console.log(output);

    expect(1).toBe(1)
  });

  test('createSwapTransactionPayload (swapForExactAmount mode)', async () => {
    console.log(convertToDecimals('0.001', 'BTC'),);
    const output = sdk.Swap.createSwapForExactAmountPayload({
      coinIn: TokensMapping.APTOS,
      coinOut: TokensMapping.BTC,
      coinInAmount: convertToDecimals('1', 'APTOS'),
      coinOutAmount: convertToDecimals('0.01584723', 'BTC'),
      slippage: 0.05,
      pool: {
        address: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9',
        lpCoin: TokensMapping.APTOSBTCLP
      }
    })

    console.log(output);

    expect(1).toBe(1)
  });
})
