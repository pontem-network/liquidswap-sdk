import Decimal from "decimal.js";

export type BigNumber = Decimal.Value | number | string;

export enum CURVES {
  STABLE = 'Stable',
  UNCORRELATED = 'Uncorrelated'
}
