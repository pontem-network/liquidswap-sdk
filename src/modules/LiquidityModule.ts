import {IModule} from "../interfaces/IModule";
import {SDK} from "../sdk";
import {
  AptosCoinInfoResource,
  AptosResource,
  AptosResourceType,
  CurveType,
  AptosPoolResource,
  TxPayloadCallFunction
} from "../types/aptos";
import Decimal from "decimal.js";
import {CURVE_STABLE, CURVE_UNCORRELATED, MODULES_ACCOUNT, NETWORKS_MODULES, RESOURCES_ACCOUNT} from "../constants";
import {composeType, d, extractAddressFromType, getPoolLpStr, getPoolStr, is_sorted, getOptimalLiquidityAmount, withSlippage, calcReceivedLP} from '../utils'
import {CreateTXPayloadParams} from "./SwapModule";


interface ICalculateRatesParams {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  amount: Decimal | number;
  interactiveToken: 'from' | 'to';
  curveType: CurveType;
  slippage: number;
}

interface ICalculateSupplyParams extends Pick<ICalculateRatesParams, 'slippage' | 'interactiveToken'>{
  toAmount: Decimal | number;
  fromAmount: Decimal | number;
  toReserve: Decimal | number;
  fromReserve: Decimal | number;
  lpSupply?: number;
}

export class LiquidityModule implements IModule {
  protected _sdk: SDK;

  get sdk() {
    return this._sdk;
  }

  constructor(sdk: SDK) {
    this._sdk = sdk;
  }

  async checkPoolExistence(params: ICalculateRatesParams): Promise<boolean> {
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

  async getLiquidityPoolResource(params: ICalculateRatesParams) {
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

  async getLiquiditySupplyResource(params: ICalculateRatesParams) {
    const curve = params.curveType === 'stable' ? CURVE_STABLE : CURVE_UNCORRELATED;

    const lpString = getPoolLpStr(params.fromToken, params.toToken, curve);

    let liquidityPoolResource;

    try {
      liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
        RESOURCES_ACCOUNT,
        composeType(NETWORKS_MODULES.CoinInfo, [lpString])
      );
    } catch (e) {
      console.log(e);
    }

    return { liquidityPoolResource };
  }

  calculateSupply (params: ICalculateSupplyParams) {
    const value = calcReceivedLP({
      x: withSlippage(
        d(params.slippage),
        params.interactiveToken === 'from' ? d(params.fromAmount) : d(params.toAmount),
        params.interactiveToken === 'from'
      ),
      y: withSlippage(
        d(params.slippage),
        params.interactiveToken === 'from' ? d(params.toAmount) : d(params.fromAmount),
        params.interactiveToken !== 'from'
      ),
      xReserve: d(params.fromReserve),
      yReserve: d(params.toReserve),
      lpSupply: params.lpSupply,
    });

    return value;
  }

  async calculateRateAndSupply(params: ICalculateRatesParams): Promise<{rate: string, receiveLp: string}> {
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

    // TODO: fix typing
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const lpSupply = lpSupplyResponse.data.supply.vec[0].integer.vec[0].value;
    const receiveLp = this.calculateSupply({
      slippage: params.slippage,
      interactiveToken: params.interactiveToken,
      fromReserve,
      toReserve,
      fromAmount: params.interactiveToken === 'from' ? params.amount : optimalAmount,
      toAmount: params.interactiveToken === 'from' ? optimalAmount : params.amount,
      lpSupply: lpSupply
    });

    return { rate: optimalAmount.toFixed(0), receiveLp };
  }

  async addLiquidityPayload (params: CreateTXPayloadParams): Promise<TxPayloadCallFunction> {
    const slippage = d(params.slippage);
    if (slippage.gte(1) || slippage.lte(0)) {
      throw new Error(`Invalid slippage (${params.slippage}) value, it should be from 0 to 1`);
    }

    const { modules } = this.sdk.networkOptions;
    const functionName = composeType(modules.Scripts, 'add_liquidity');

    const curve = params.curveType === 'stable' ? CURVE_STABLE : CURVE_UNCORRELATED;
    const typeArguments = [
      params.fromToken,
      params.toToken,
      curve
    ];

    const isPlussed = params.interactiveToken === 'from';

    const fromAmountWithSlippage = withSlippage(
      d(params.slippage),
      d(params.fromAmount),
      isPlussed
    ).toFixed(0);

    const toAmountWithSlippage = withSlippage(
      d(params.slippage),
      d(params.toAmount),
      isPlussed
    ).toFixed(0);

    const args = [
      params.fromAmount,
      fromAmountWithSlippage,
      params.toAmount,
      toAmountWithSlippage
    ] as string[];

    return {
      type: 'entry_function_payload',
      function: functionName,
      typeArguments,
      arguments: args
    }
  }
}
