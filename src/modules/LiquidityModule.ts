import {IModule} from "../interfaces/IModule";
import {SDK} from "../sdk";
import { AptosResource, AptosResourceType, CurveType } from "../types/aptos";
import Decimal from "decimal.js";
import {CURVE_STABLE, CURVE_UNCORRELATED, MODULES_ACCOUNT, RESOURCES_ACCOUNT} from "../constants";
import { composeType, getPoolStr } from '../utils'


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
    } catch (e) {
      return false;
    }
  }

}
