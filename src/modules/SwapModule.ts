import Decimal from 'decimal.js'

import { SDK } from "../sdk";
import { IModule } from "../interfaces/IModule";
import {
  AptosCoinInfoResource,
  AptosPoolResource,
  AptosResourceType,
  TAptosTxPayload,
  CurveType,
} from "../types/aptos";
import {
  withSlippage,
  composeType,
  extractAddressFromType,
  getCoinInWithFees,
  getCoinOutWithFees,
  getCoinsOutWithFeesStable,
  getCoinsInWithFeesStable,
  d,
  is_sorted,
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
  amount: Decimal;
  interactiveToken: 'from' | 'to';
  curveType: CurveType;
}

export type CreateTXPayloadParams = {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  fromAmount: Decimal;
  toAmount: Decimal;
  interactiveToken: 'from' | 'to';
  slippage: Decimal;
  stableSwapType: 'high' | 'normal';
  curveType: CurveType;
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

    const { liquidityPoolType, liquidityPoolResource } = await this.getLiquidityPoolResource(params);

    if(!liquidityPoolResource) {
      throw new Error(`LiquidityPool (${liquidityPoolType}) not found`)
    }

    const isSorted = is_sorted(params.fromToken, params.toToken);

    const [sortedFromCoinInfo, sortedToCoinInfo] = isSorted
      ? [fromCoinInfo, toCoinInfo]
      : [toCoinInfo, fromCoinInfo];

    const coinXReserve = d(liquidityPoolResource.data.coin_x_reserve.value);
    const coinYReserve = d(liquidityPoolResource.data.coin_y_reserve.value);
    const fee = d(liquidityPoolResource.data.fee);

    const coinFromDecimals = +sortedFromCoinInfo.data.decimals;
    const coinToDecimals = +sortedToCoinInfo.data.decimals;


    const [fromReserve, toReserve] = isSorted
      ? [coinXReserve, coinYReserve]
      : [coinYReserve, coinXReserve];

    let rate;
    if (!params.amount) {
      throw new Error(`Amount equals zero or undefined`);
    }

    if (params.curveType === 'uncorrelated') {
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
          d(Math.pow(10, coinToDecimals)),
          d(Math.pow(10, coinFromDecimals)),
          fee
        )
        : getCoinsInWithFeesStable(
          params.amount,
          fromReserve,
          toReserve,
          d(Math.pow(10, coinFromDecimals)),
          d(Math.pow(10, coinToDecimals)),
          fee
        )

      return rate.toString();
    }
  }

  createSwapTransactionPayload(params: CreateTXPayloadParams): TAptosTxPayload {
    if(params.slippage.gte(1) || params.slippage.lte(0 )) {
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
        : withSlippage(params.slippage, params.fromAmount, true).toFixed(0);
    const toAmount =
      params.interactiveToken === 'to'
        ? params.toAmount
        : withSlippage(params.slippage, params.toAmount, false).toFixed(0);

    const args = [fromAmount.toString(), toAmount.toString()];

    return {
      type: 'entry_function_payload',
      function: functionName,
      typeArguments: typeArguments,
      arguments: args,
    };
  }

  async getLiquidityPoolResource(params: CalculateRatesParams) {
    const modulesLiquidityPool = composeType(
      MODULES_ACCOUNT,
      'liquidity_pool',
      'LiquidityPool',
    );

    function getPoolStr(
      coinX: string,
      coinY: string,
      curve: string,
    ): string {
      const [sortedX, sortedY] = is_sorted(coinX, coinY)
        ? [coinX, coinY]
        : [coinY, coinX];
      return composeType(modulesLiquidityPool, [sortedX, sortedY, curve]);
    }
    const curve = params.curveType === 'stable' ? CURVE_STABLE : CURVE_UNCORRELATED;

    const liquidityPoolType = getPoolStr(params.fromToken,
      params.toToken,
      curve);

    let liquidityPoolResource;

    try {
      liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosPoolResource>(
        RESOURCES_ACCOUNT,
        liquidityPoolType
      )
    } catch (e) {
      console.log(e)
    }
    return { liquidityPoolType, liquidityPoolResource }
  }
}


