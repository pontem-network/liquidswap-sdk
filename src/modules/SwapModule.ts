import { SDK } from "../sdk";
import { IModule } from "../interfaces/IModule";
import {
  AptosCoinInfoResource,
  AptosPoolResource,
  AptosResourceType,
  TAptosTxPayload
} from "../types/aptos";
import {
  withSlippage,
  composeType,
  extractAddressFromType,
  is_sorted,
  getCoinInWithFees,
  getCoinOutWithFees,
  getCoinsOutWithFeesStable,
  getCoinsInWithFeesStable,
} from "../utils";
import {
  MODULES_ACCOUNT,
  RESOURCES_ACCOUNT,
  CURVE_STABLE,
  CURVE_UNCORRELATED
} from '../constants';

export type CalculateRatesParams = {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  amount: number;
  interactiveToken: 'from' | 'to';
  curveType: 'stable' | 'uncorrelated' | 'selectable';
}

export type CreateTXPayloadParams = {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  fromAmount: number;
  toAmount: number;
  interactiveToken: 'from' | 'to';
  slippage: number;
  stableSwapType: 'high' | 'normal';
  curveType: 'stable' | 'uncorrelated' | 'selectable';
}

export class SwapModule implements IModule {
  protected _sdk: SDK;

  get sdk() {
    return this._sdk;
  }

  constructor(sdk: SDK) {
    this._sdk = sdk;
  }

  async calculateRates(params: CalculateRatesParams): Promise<string> {
    const { modules } = this.sdk.networkOptions;

    const fromCoinInfo = await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.fromToken),
      composeType(modules.CoinInfo, [params.fromToken])
    )

    const toCoinInfo = await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.toToken),
      composeType(modules.CoinInfo, [params.toToken])
    )

    if(!fromCoinInfo) {
      throw new Error('From Coin not exists');
    }

    if(!toCoinInfo) {
      throw new Error('To Coin not exists');
    }

    const isSorted = is_sorted(fromCoinInfo.data.symbol, toCoinInfo.data.symbol);
    const [fromToken, toToken] = isSorted
      ? [params.fromToken, params.toToken]
      : [params.toToken, params.fromToken];

    const liquidityPoolType = composeType(
      MODULES_ACCOUNT,
      'liquidity_pool',
      'LiquidityPool'
    );

    const curve = params.curveType === 'stable' ? CURVE_STABLE : CURVE_UNCORRELATED;

    const resourceType = composeType(liquidityPoolType, [
      fromToken,
      toToken,
      curve,
    ]);

    const liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosPoolResource>(
      RESOURCES_ACCOUNT,
      resourceType
    )

    if(!liquidityPoolResource) {
      throw new Error(`LiquidityPool (${liquidityPoolType}) not found`)
    }

    const coinXReserve = +liquidityPoolResource.data.coin_x_reserve.value;
    const coinYReserve = +liquidityPoolResource.data.coin_y_reserve.value;
    const fee = +liquidityPoolResource.data.fee;
    const coinFromDecimals = +fromCoinInfo.data.decimals;
    const coinToDecimals = +toCoinInfo.data.decimals;

    const [fromReserve, toReserve] = isSorted
      ? params.interactiveToken === 'from'
        ? [coinXReserve, coinYReserve]
        : [coinYReserve, coinXReserve]
      : params.interactiveToken === 'from'
        ? [coinYReserve, coinXReserve]
        : [coinXReserve, coinYReserve];

    let rate;
    if (!params.amount) {
      throw new Error(`Amount equals zero or undefined`);
    }

    if (params.curveType === 'stable') {
      rate = params.interactiveToken === 'from'
        ? getCoinOutWithFees(params.amount, fromReserve, toReserve, fee)
        : getCoinInWithFees(params.amount, toReserve, fromReserve, fee);
      return rate.toString();

    } else {
      rate = params.interactiveToken === 'from'
        ? getCoinsOutWithFeesStable(
          params.amount,
          toReserve,
          fromReserve,
          Math.pow(10, coinToDecimals),
          Math.pow(10, coinFromDecimals),
          fee
        )
        : getCoinsInWithFeesStable(
          params.amount,
          fromReserve,
          toReserve,
          Math.pow(10, coinFromDecimals),
          Math.pow(10, coinToDecimals),
          fee
        )

      return rate;
    }
  }

  createSwapTransactionPayload(params: CreateTXPayloadParams): TAptosTxPayload {
    if(params.slippage >= 1 || params.slippage <= 0) {
      throw new Error(`Invalid slippage (${params.slippage}) value`);
    }

    const { modules } = this.sdk.networkOptions;

    const isUnchecked = params.curveType === 'stable' && params.stableSwapType === 'normal';

    const functionName = composeType(
      modules.Scripts,
      isUnchecked
      ? 'swap_unchecked'
      : params.interactiveToken === 'from' ? 'swap' : 'swap_into'
    );

    const curve = params.curveType === 'stable' ? CURVE_STABLE : CURVE_UNCORRELATED;

    const typeArguments = [
      params.fromToken,
      params.toToken,
      curve
    ];

    const fromAmount =
      params.interactiveToken === 'from'
        ? params.fromAmount
        : withSlippage(params.slippage, params.fromAmount).toFixed(0);
    const toAmount =
      params.interactiveToken === 'to'
        ? params.toAmount
        : withSlippage(params.slippage, params.toAmount).toFixed(0);

    const args = [fromAmount.toString(), toAmount.toString()];

    return {
      type: 'entry_function_payload',
      function: functionName,
      typeArguments: typeArguments,
      arguments: args,
    };
  }
}


