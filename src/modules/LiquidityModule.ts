import {IModule} from "../interfaces/IModule";
import {SDK} from "../sdk";
import {AptosCoinInfoResource, AptosResource, AptosResourceType, CurveType, AptosPoolResource} from "../types/aptos";
import Decimal from "decimal.js";
import {CURVE_STABLE, CURVE_UNCORRELATED, MODULES_ACCOUNT, NETWORKS_MODULES, RESOURCES_ACCOUNT} from "../constants";
import {composeType, d, extractAddressFromType, getPoolLpStr, getPoolStr, is_sorted, getOptimalLiquidityAmount} from '../utils'


type CalculateRatesParams = {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  amount: Decimal | number;
  interactiveToken: 'from' | 'to';
  curveType: CurveType;
};

export interface IPoolExist {
  fromCoin: string;
  toCoin: string;
  curve: string;
}

export class LiquidityModule implements IModule {
  protected _sdk: SDK;

  get sdk() {
    return this._sdk;
  }

  constructor(sdk: SDK) {
    this._sdk = sdk;
  }

  async checkPoolExistence(params: CalculateRatesParams): Promise<boolean> {
    const modulesLiquidityPool = composeType(
      MODULES_ACCOUNT,
      'liquidity_pool',
      'LiquidityPool',
    );

    const curve = params.curveType === 'stable' ? CURVE_STABLE : CURVE_UNCORRELATED;

    const liquidityPoolType = getPoolStr(params.fromToken, params.toToken, curve, modulesLiquidityPool);

    try {
      const liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosResource>(
        RESOURCES_ACCOUNT,
        liquidityPoolType
      );
        return Boolean(liquidityPoolResource?.data?.type);
      } catch (_e) {
      return false;
    }
  }

  async getLiquidityPoolResource(params: CalculateRatesParams) {
    const modulesLiquidityPool = composeType(
      MODULES_ACCOUNT,
      'liquidity_pool',
      'LiquidityPool',
    );
    const curve = params.curveType === 'stable' ? CURVE_STABLE : CURVE_UNCORRELATED;

    const liquidityPoolType = getPoolStr(params.fromToken, params.toToken, curve, modulesLiquidityPool);

    let liquidityPoolResource;

    try {
      liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosPoolResource>(
        RESOURCES_ACCOUNT,
        liquidityPoolType
      );
    } catch (e) {
      console.log(e);
    }
    return { liquidityPoolResource };
  }

  async getLiquiditySupplyResource(params: CalculateRatesParams) {
    const lpString = getPoolLpStr(params.fromToken, params.toToken, params.curveType);

    const liquidityPoolType = composeType(NETWORKS_MODULES.CoinInfo, lpString);

    let liquidityPoolResource;

    try {
      liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
        RESOURCES_ACCOUNT,
        liquidityPoolType
      );
    } catch (e) {
      console.log(e);
    }

    return { liquidityPoolResource }
  }

  async calculateRateAndSupply(params: CalculateRatesParams): Promise<{rate: string, lpSupply: string}> {
    const { modules } = this.sdk.networkOptions;

    let fromCoinInfo;
    try {
      fromCoinInfo = await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
        extractAddressFromType(params.fromToken),
        composeType(modules.CoinInfo, [params.fromToken])
      );
    } catch (e) {
      console.log(e);
    }

    let toCoinInfo;
    try {
      toCoinInfo = await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
        extractAddressFromType(params.toToken),
        composeType(modules.CoinInfo, [params.toToken])
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

    const { liquidityPoolResource } = await this.getLiquidityPoolResource(params);

    if (!liquidityPoolResource) {
      throw new Error(`LiquidityPool not existed`);
    }

    const isSorted = is_sorted(params.fromToken, params.toToken);

    const fromReserve = isSorted ?
      d(liquidityPoolResource.data.coin_x_reserve.value) :
      d(liquidityPoolResource.data.coin_y_reserve.value);
    const toReserve = isSorted ?
      d(liquidityPoolResource.data.coin_y_reserve.value) :
      d(liquidityPoolResource.data.coin_x_reserve.value);

    const optimalAmount =
      params.interactiveToken === 'from'
        ? getOptimalLiquidityAmount(
          d(params.amount),
          fromReserve,
          toReserve,
        )
        : getOptimalLiquidityAmount(
          d(params.amount),
          toReserve,
          fromReserve,
        );

    const { liquidityPoolResource: lpSupplyResponse } = await this.getLiquiditySupplyResource(params);
    if (!lpSupplyResponse) {
      throw new Error(`lpSupplyResponse not existed`);
    }

    const lpSupply = lpSupplyResponse.data.supply.vec[0].integer.vec[0].value;


    return { rate: optimalAmount, lpSupply };
  }
}
