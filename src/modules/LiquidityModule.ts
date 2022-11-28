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
import {
  composeType,
  d,
  extractAddressFromType,
  getPoolLpStr, getPoolStr,
  is_sorted,
  getOptimalLiquidityAmount,
  withSlippage,
  calcReceivedLP,
  calcOutputBurnLiquidity,
} from '../utils'
import { CreateTXPayloadParams } from "./SwapModule";


interface ICreateBurnLiquidityPayload {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  burnAmount: Decimal | number;
  slippage: number;
  curveType: CurveType;
}

interface ICalculateRatesParams {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  amount: Decimal | number;
  interactiveToken: 'from' | 'to';
  curveType: CurveType;
  slippage: number;
}

interface ICalculateSupplyParams extends Pick<ICalculateRatesParams, 'slippage'>{
  toAmount: Decimal | number;
  fromAmount: Decimal | number;
  toReserve: Decimal | number;
  fromReserve: Decimal | number;
  isSorted: boolean;
  lpSupply?: number;
}

interface ICalculateBurnLiquidityParams {
  fromToken: string;
  toToken: string;
  slippage: number;
  burnAmount: Decimal | number;
  curveType: CurveType;
}

export class LiquidityModule implements IModule {
  protected _sdk: SDK;

  get sdk() {
    return this._sdk;
  }

  constructor(sdk: SDK) {
    this._sdk = sdk;
  }

  async checkPoolExistence(params: Omit<ICalculateRatesParams, 'amount'>): Promise<boolean> {
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
      return Boolean(liquidityPoolResource?.type);
    } catch (_e) {
      return false;
    }
  }

  async getLiquidityPoolResource(params: Omit<ICalculateRatesParams, 'amount' | 'interactiveToken'>) {
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
      console.log(e)
    }
    return { liquidityPoolResource };
  }

  async getLiquiditySupplyResource(params: Omit<ICalculateRatesParams, 'amount' | 'interactiveToken'>) {
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
        params.isSorted ? d(params.fromAmount) : d(params.toAmount),
        false
      ),
      y: withSlippage(
        d(params.slippage),
        params.isSorted ? d(params.toAmount) : d(params.fromAmount),
        false
      ),
      xReserve: params.isSorted ? d(params.fromReserve) : d(params.toReserve),
      yReserve: params.isSorted ? d(params.toReserve) : d(params.fromReserve),
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

    const isSorted = is_sorted(params.fromToken, params.toToken);

    const { liquidityPoolResource } = await this.getLiquidityPoolResource(params);

    if (!liquidityPoolResource) {
      throw new Error(`LiquidityPool not existed`);
    }

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

    let lpSupply;
    try {
      // TODO: fix typing
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      lpSupply = lpSupplyResponse.data.supply.vec[0].integer.vec[0].value;
    } catch (e) {
      console.log(e);
    }

    const receiveLp = this.calculateSupply({
      slippage: params.slippage,
      fromReserve,
      toReserve,
      fromAmount: params.interactiveToken === 'from' ? params.amount : optimalAmount,
      toAmount: params.interactiveToken === 'to' ? params.amount : optimalAmount,
      lpSupply: lpSupply,
      isSorted
    });

    return { rate: optimalAmount.toFixed(0), receiveLp };
  }

  async createAddLiquidityPayload (params: CreateTXPayloadParams): Promise<TxPayloadCallFunction> {
    const slippage = d(params.slippage);
    if (slippage.gte(1) || slippage.lte(0)) {
      throw new Error(`Invalid slippage (${params.slippage}) value, it should be from 0 to 1`);
    }

    const isPoolExisted = await this.checkPoolExistence(params);

    const { modules } = this.sdk.networkOptions;
    const functionName = composeType(modules.Scripts, isPoolExisted ? 'add_liquidity' : 'register_pool_and_add_liquidity');
    const curve = params.curveType === 'stable' ? CURVE_STABLE : CURVE_UNCORRELATED;
    const isSorted = is_sorted(params.fromToken, params.toToken);

    const typeArguments = isSorted
      ? [
          params.fromToken,
          params.toToken,
          curve
        ]
      : [
          params.toToken,
          params.fromToken,
          curve
        ];

    const fromAmountWithSlippage = withSlippage(
      d(params.slippage),
      d(params.fromAmount),
      false
    ).toFixed(0);

    const toAmountWithSlippage = withSlippage(
      d(params.slippage),
      d(params.toAmount),
      false
    ).toFixed(0);

    const args = isSorted ?
      [
        params.fromAmount.toString(),
        fromAmountWithSlippage,
        params.toAmount.toString(),
        toAmountWithSlippage
      ]
    : [
        params.toAmount.toString(),
        toAmountWithSlippage,
        params.fromAmount.toString(),
        fromAmountWithSlippage
      ];

    return {
      type: 'entry_function_payload',
      function: functionName,
      typeArguments,
      arguments: args
    }
  }

  async createBurnLiquidityPayload (params: ICreateBurnLiquidityPayload) {
    const slippage = d(params.slippage);
    if (slippage.gte(1) || slippage.lte(0)) {
      throw new Error(`Invalid slippage (${params.slippage}) value, it should be from 0 to 1`);
    }

    const curve = params.curveType === 'stable' ? CURVE_STABLE : CURVE_UNCORRELATED;
    const { modules } = this.sdk.networkOptions;

    const output = await this.calculateOutputBurn(params);

    const xOutput = output?.x ?? '0';
    const yOutput = output?.y ?? '0';

    const isSorted = is_sorted(params.fromToken, params.toToken);

    const args = isSorted
      ? [params.burnAmount.toString(), xOutput, yOutput]
      : [params.burnAmount.toString(), yOutput, xOutput];

    const functionName = composeType(
      modules.Scripts,
      'remove_liquidity',
    );

    const typeArguments = isSorted
      ? [
          params.fromToken,
          params.toToken,
          curve,
        ]
      : [
          params.toToken,
          params.fromToken,
          curve,
        ];
    return {
      type: 'entry_function_payload',
      function: functionName,
      typeArguments,
      arguments: args,
    }
  }

  async calculateOutputBurn (params: ICalculateBurnLiquidityParams) {
    const { liquidityPoolResource } = await this.getLiquidityPoolResource(params);
    const { liquidityPoolResource: lpSupplyResponse } = await this.getLiquiditySupplyResource(params);

    if (!lpSupplyResponse) {
      throw new Error(`lpSupplyResponse not existed`);
    }

    let lpSupply;
    try {
      // TODO: fix typing
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      lpSupply = lpSupplyResponse.data.supply.vec[0].integer.vec[0].value;
    } catch (e) {
      console.log(e);
    }

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

    const outputVal = calcOutputBurnLiquidity({
      xReserve: fromReserve,
      yReserve: toReserve,
      lpSupply: d(lpSupply),
      toBurn: d(params.burnAmount),
    });

    if (!outputVal) {
      return;
    }

    return {
      x: withSlippage(d(params.slippage), outputVal['x'], false).toFixed(0),
      y: withSlippage(d(params.slippage), outputVal['y'], false).toFixed(0),
      withoutSlippage: { x: outputVal['x'].toFixed(0), y: outputVal['y'].toFixed(0) }
    }
  }
}
