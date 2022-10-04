import {SDK} from "../sdk";
import {IModule} from "../interfaces/IModule";
import {AptosCoinInfoResource, AptosPoolResource, AptosResourceType, TxPayloadCallFunction} from "../types/aptos";
import {BigNumber, CURVES} from "../types";
import {composeType, extractAddressFromType} from "../utils/contracts";
import {d} from "../utils/numbers";
import Decimal from "decimal.js";

export type CalculateRatesParams = {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  amount: BigNumber;
  interactiveToken: 'from' | 'to',
  pool: {
    moduleAddress: string,
    address: string,
    curves: CURVES,
    lpToken: string
  },
}

export type CreateTXPayloadParams = {
  fromToken: AptosResourceType;
  toToken: AptosResourceType;
  fromAmount: BigNumber;
  toAmount: BigNumber;
  interactiveToken: 'from' | 'to';
  slippage: number,
  pool: {
    lpToken: AptosResourceType,
    moduleAddress: string,
    address: string,
    curves: CURVES,
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

  async calculateRates(params: CalculateRatesParams): Promise<string> {
    params.pool.lpToken = `${params.pool.lpToken}<${params.fromToken}, ${params.toToken}, ${params.pool.curves}>`
    const {modules} = this.sdk.networkOptions;

    const fromCoinInfo = await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.fromToken),
      composeType(modules.CoinInfo, [params.fromToken])
    )

    const toCoinInfo = await this.sdk.Resources.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.toToken),
      composeType(modules.CoinInfo, [params.toToken])
    )

    if (!fromCoinInfo) {
      throw new Error('To Coin not exists');
    }

    if (!toCoinInfo) {
      throw new Error('To Coin not exists');
    }


    const {liquidityPoolType, liquidityPoolResource, isRevert} = await this.getLiquidityPoolResource(params);
    if (!liquidityPoolResource) {
      throw new Error(`LiquidityPool (${liquidityPoolType}) not found`)
    }

    const coinXReserve = liquidityPoolResource.data.coin_x_reserve.value
    const coinYReserve = liquidityPoolResource.data.coin_y_reserve.value

    const [reserveX, reserveY] = isRevert
      ? params.interactiveToken === 'from'
        ? [d(coinXReserve), d(coinYReserve)]
        : [d(coinYReserve), d(coinXReserve)]
      : params.interactiveToken === 'from'
        ? [d(coinYReserve), d(coinXReserve)]
        : [d(coinXReserve), d(coinYReserve)];

    const outputTokens =
      params.interactiveToken === 'from'
        ? getCoinOutWithFees(d(params.amount), reserveX, reserveY)
        : getCoinInWithFees(d(params.amount), reserveX, reserveY);

    return outputTokens.toString();
  }

  async getLiquidityPoolResource(params: CalculateRatesParams) {
    let isRevert = true
    let liquidityPoolType = composeType(params.pool.moduleAddress, 'liquidity_pool', 'LiquidityPool', [
      params.fromToken,
      params.toToken,
      `${params.pool.moduleAddress}::curves::${params.pool.curves}`
    ])

    let liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosPoolResource>(
      params.pool.address,
      liquidityPoolType
    )

    if (!liquidityPoolResource) {
      isRevert = false
      liquidityPoolType = composeType(params.pool.moduleAddress, 'liquidity_pool', 'LiquidityPool', [
        params.toToken,
        params.fromToken,
        `${params.pool.moduleAddress}::curves::${params.pool.curves}`
      ])
      liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosPoolResource>(
        params.pool.address,
        liquidityPoolType
      )
    }

    return {liquidityPoolType, liquidityPoolResource, isRevert}
  }


  createSwapTransactionPayload(params: CreateTXPayloadParams): TxPayloadCallFunction {

    if (params.slippage >= 1 || params.slippage <= 0) {
      throw new Error(`Invalid slippage (${params.slippage}) value`);
    }

    const {modules} = this.sdk.networkOptions;

    const functionName = composeType(
      modules.Scripts,
      params.interactiveToken === 'from' ? 'swap' : 'swap_into'
    );

    const typeArguments = [
      params.fromToken,
      params.toToken,
      `${params.pool.moduleAddress}::curves::${params.pool.curves}`,
    ];

    const fromAmount =
      params.interactiveToken === 'from'
        ? params.fromAmount
        : withSlippage(d(params.fromAmount), d(params.slippage), 'minus')
    const toAmount =
      params.interactiveToken === 'to'
        ? params.toAmount
        : withSlippage(d(params.toAmount), d(params.slippage), 'plus')

    const args = [d(fromAmount).toString(), d(toAmount).toString()];

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
  const {feePct, feeScale} = {feePct: d(3), feeScale: d(1000)};
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
  const {feePct, feeScale} = {feePct: d(3), feeScale: d(1000)};
  const feeMultiplier = feeScale.sub(feePct);
  const newReservesOutSize = reserveOutSize.sub(coinOutVal).mul(feeMultiplier);

  return coinOutVal.mul(feeScale).mul(reserveInSize).div(newReservesOutSize).plus(1).toDP(0);
}

export function withSlippage(value: Decimal.Instance, slippage: Decimal.Instance, mode: 'plus' | 'minus') {
  return d(value)[mode](d(value).mul(slippage)).toDP(0);
}
