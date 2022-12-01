import Decimal from 'decimal.js';

import { SDK } from '../sdk';
import { IModule } from '../interfaces/IModule';
import {
  AptosCoinInfoResource,
  AptosPoolResource,
  AptosResourceType,
  TAptosTxPayload,
  CurveType,
} from '../types/aptos';
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
} from '../utils';

export type CalculateRatesParams = {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  amount: Decimal | number;
  interactiveToken: 'from' | 'to';
  curveType: CurveType;
};

export type CreateTXPayloadParams = {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  fromAmount: Decimal | number;
  toAmount: Decimal | number;
  interactiveToken: 'from' | 'to';
  slippage: number;
  stableSwapType: 'high' | 'normal';
  curveType: CurveType;
};

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

    let fromCoinInfo;
    try {
      fromCoinInfo =
        await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
          extractAddressFromType(params.fromToken),
          composeType(modules.CoinInfo, [params.fromToken]),
        );
    } catch (e) {
      console.log(e);
    }

    let toCoinInfo;
    try {
      toCoinInfo =
        await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
          extractAddressFromType(params.toToken),
          composeType(modules.CoinInfo, [params.toToken]),
        );
    } catch (e) {
      console.log(e);
    }

    if (!fromCoinInfo) {
      throw new Error('From Coin not exists');
    }

    if (!toCoinInfo) {
      throw new Error('To Coin not exists');
    }

    const { liquidityPoolType, liquidityPoolResource } =
      await this.getLiquidityPoolResource(params);

    if (!liquidityPoolResource) {
      throw new Error(`LiquidityPool (${liquidityPoolType}) not found`);
    }

    const isSorted = is_sorted(params.fromToken, params.toToken);

    const [sortedFromCoinInfo, sortedToCoinInfo] = isSorted
      ? [fromCoinInfo, toCoinInfo]
      : [toCoinInfo, fromCoinInfo];

    const fromReserve = isSorted
      ? d(liquidityPoolResource.data.coin_x_reserve.value)
      : d(liquidityPoolResource.data.coin_y_reserve.value);
    const toReserve = isSorted
      ? d(liquidityPoolResource.data.coin_y_reserve.value)
      : d(liquidityPoolResource.data.coin_x_reserve.value);

    const fee = d(liquidityPoolResource.data.fee);

    const coinFromDecimals = +sortedFromCoinInfo.data.decimals;
    const coinToDecimals = +sortedToCoinInfo.data.decimals;

    const amount = d(params.amount);

    if (amount.comparedTo(0) === 0) {
      throw new Error(`Amount equals zero or undefined`);
    }

    if (params.interactiveToken === 'to' && toReserve.lessThan(amount)) {
      throw new Error(`Insufficient funds in Liquidity Pool`);
    }

    let rate;

    if (params.curveType === 'uncorrelated') {
      rate =
        params.interactiveToken === 'from'
          ? getCoinOutWithFees(amount, fromReserve, toReserve, fee)
          : getCoinInWithFees(amount, toReserve, fromReserve, fee);
    } else {
      rate =
        params.interactiveToken === 'from'
          ? getCoinsOutWithFeesStable(
              amount,
              fromReserve,
              toReserve,
              d(Math.pow(10, coinFromDecimals)),
              d(Math.pow(10, coinToDecimals)),
              fee,
            )
          : getCoinsInWithFeesStable(
              amount,
              toReserve,
              fromReserve,
              d(Math.pow(10, coinToDecimals)),
              d(Math.pow(10, coinFromDecimals)),
              fee,
            );
    }
    return rate.toFixed(0);
  }

  createSwapTransactionPayload(params: CreateTXPayloadParams): TAptosTxPayload {
    const curves = this.sdk.curves;
    const slippage = d(params.slippage);

    if (slippage.gte(1) || slippage.lte(0)) {
      throw new Error(
        `Invalid slippage (${params.slippage}) value, it should be from 0 to 1`,
      );
    }

    const { modules } = this.sdk.networkOptions;

    const isUnchecked =
      params.curveType === 'stable' && params.stableSwapType === 'normal';

    const functionName = composeType(
      modules.Scripts,
      isUnchecked
        ? 'swap_unchecked'
        : params.interactiveToken === 'from'
        ? 'swap'
        : 'swap_into',
    );

    const curve = curves[params.curveType];

    const typeArguments = [params.fromToken, params.toToken, curve];

    const fromAmount =
      params.interactiveToken === 'from'
        ? params.fromAmount
        : withSlippage(slippage, d(params.fromAmount), true).toFixed(0);
    const toAmount =
      params.interactiveToken === 'to'
        ? params.toAmount
        : withSlippage(slippage, d(params.toAmount), false).toFixed(0);

    const args = [fromAmount.toString(), toAmount.toString()];

    return {
      type: 'entry_function_payload',
      function: functionName,
      type_arguments: typeArguments,
      arguments: args,
    };
  }

  async getLiquidityPoolResource(params: CalculateRatesParams) {
    const { resourceAccount, moduleAccount } = this.sdk.networkOptions;
    const curves = this.sdk.curves;

    const modulesLiquidityPool = composeType(
      moduleAccount,
      'liquidity_pool',
      'LiquidityPool',
    );

    function getPoolStr(coinX: string, coinY: string, curve: string): string {
      const [sortedX, sortedY] = is_sorted(coinX, coinY)
        ? [coinX, coinY]
        : [coinY, coinX];
      return composeType(modulesLiquidityPool, [sortedX, sortedY, curve]);
    }
    const curve = curves[params.curveType];

    const liquidityPoolType = getPoolStr(
      params.fromToken,
      params.toToken,
      curve,
    );

    let liquidityPoolResource;

    try {
      liquidityPoolResource =
        await this.sdk.Resources.fetchAccountResource<AptosPoolResource>(
          resourceAccount,
          liquidityPoolType,
        );
    } catch (e) {
      console.log(e);
    }
    return { liquidityPoolType, liquidityPoolResource };
  }
}
