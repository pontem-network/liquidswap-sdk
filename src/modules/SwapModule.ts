import {SDK} from "../sdk";
import {IModule} from "../interfaces/IModule";
import {
  AptosCoinInfoResource,
  AptosPoolResource,
  AptosResourceType,
  TxPayloadCallFunction
} from "../types/aptos";
import {BigNumber} from "../types";
import {composeType, extractAddressFromType, isSortedSymbols} from "../utils/contracts";
import {d} from "../utils/numbers";
import Decimal from "decimal.js";

export type GetAmountInOutParams = {
  coinIn: AptosResourceType;
  coinOut: AptosResourceType;
  amount: BigNumber;
  pool: {
    address: string,
    lpCoin: AptosResourceType,
  },
}

export type CreateSwapTxPayload = {
  coinIn: AptosResourceType;
  coinOut: AptosResourceType;
  coinInAmount: BigNumber;
  coinOutAmount: BigNumber;
  slippage: number,
  pool: {
    address: string,
    lpCoin: AptosResourceType,
  },
}

export class SwapModule implements IModule {
  protected _sdk: SDK;

  get sdk() {
    return this._sdk;
  }

  constructor(sdk: SDK) {
    this._sdk = sdk;
  }

  async getAmountIn(params: GetAmountInOutParams): Promise<string> {
    return this.calculateRates(params, true);
  }

  async getAmountOut(params: GetAmountInOutParams): Promise<string> {
    return this.calculateRates(params, false);
  }

  async calculateRates(params: GetAmountInOutParams, isIn: boolean): Promise<string> {
    const { modules } = this.sdk.networkOptions;

    const fromCoinInfo = await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.coinIn),
      composeType(modules.CoinInfo, [params.coinIn])
    )

    const toCoinInfo = await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.coinOut),
      composeType(modules.CoinInfo, [params.coinOut])
    )

    if(!fromCoinInfo) {
      throw new Error('coinIn doesn\'t exist');
    }

    if(!toCoinInfo) {
      throw new Error('coinOut doesn\'t exists');
    }

    const isSorted = isSortedSymbols(fromCoinInfo.data.symbol, toCoinInfo.data.symbol);
    const [coinX, coinY] = isSorted
      ? [params.coinIn, params.coinOut]
      : [params.coinOut, params.coinIn];

    const liquidityPoolType = composeType(modules.LiquidswapDeployer, 'liquidity_pool', 'LiquidityPool', [
      coinX,
      coinY,
      params.pool.lpCoin,
    ]);

    const liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosPoolResource>(
      params.pool.address,
      liquidityPoolType,
    )

    if(!liquidityPoolResource) {
      throw new Error(`LiquidityPool (${liquidityPoolType}) not found`)
    }

    const coinXReserve = liquidityPoolResource.data.coin_x_reserve.value
    const coinYReserve = liquidityPoolResource.data.coin_y_reserve.value

    const [reserveIn, reserveOut] = isSorted? [d(coinXReserve), d(coinYReserve)] : [d(coinYReserve), d(coinXReserve)];

    const outputTokens = isIn? getCoinOutWithFees(d(params.amount), reserveIn, reserveOut) : getCoinInWithFees(d(params.amount), reserveOut, reserveIn);
    
    return outputTokens.toString();
  }

  createSwapExactAmountPayload(params: CreateSwapTxPayload): TxPayloadCallFunction {
    return this.createSwapTransactionPayload(params, true);
  }

  createSwapForExactAmountPayload(params: CreateSwapTxPayload): TxPayloadCallFunction {
    return this.createSwapTransactionPayload(params, false);
  }

  createSwapTransactionPayload(params: CreateSwapTxPayload, isSwapIn: boolean): TxPayloadCallFunction {
    if(params.slippage >= 1 || params.slippage <= 0) {
      throw new Error(`Invalid slippage (${params.slippage}) value`);
    }

    const { modules } = this.sdk.networkOptions;

    const functionName = composeType(
      `${modules.LiquidswapDeployer}::scripts`,
      isSwapIn ? 'swap' : 'swap_into'
    );

    const typeArguments = [
      params.coinIn,
      params.coinOut,
      params.pool.lpCoin,
    ];

    const coinInAmount = isSwapIn ? params.coinInAmount :  withSlippage(d(params.coinInAmount), d(params.slippage), 'minus');
    const coinOutAmount = isSwapIn ? withSlippage(d(params.coinOutAmount), d(params.slippage), 'plus') : params.coinOutAmount;

    const args = [params.pool.address, d(coinInAmount).toString(), d(coinOutAmount).toString()];

    return {
      type: 'script_function_payload',
      function: functionName,
      typeArguments: typeArguments,
      arguments: args,
    };
  }
}

function getCoinOutWithFees(
  coinInVal: Decimal.Instance,
  reserveInSize: Decimal.Instance,
  reserveOutSize: Decimal.Instance
) {
  const { feePct, feeScale } = { feePct: d(3), feeScale: d(1000) };
  const feeMultiplier = feeScale.sub(feePct);
  const coinInAfterFees = coinInVal.mul(feeMultiplier);
  const newReservesInSize = reserveInSize.mul(feeScale).plus(coinInAfterFees);

  return coinInAfterFees.mul(reserveOutSize).div(newReservesInSize).toDP(0);
}

function getCoinInWithFees(
  coinOutVal: Decimal.Instance,
  reserveOutSize: Decimal.Instance,
  reserveInSize: Decimal.Instance
) {
  const { feePct, feeScale } = { feePct: d(3), feeScale: d(1000) };
  const feeMultiplier = feeScale.sub(feePct);
  const newReservesOutSize = reserveOutSize.sub(coinOutVal).mul(feeMultiplier);

  return coinOutVal.mul(feeScale).mul(reserveInSize).div(newReservesOutSize).plus(1).toDP(0);
}

export function withSlippage(value: Decimal.Instance, slippage: Decimal.Instance, mode: 'plus' | 'minus') {
  return d(value)[mode](d(value).mul(slippage)).toDP(0);
}
