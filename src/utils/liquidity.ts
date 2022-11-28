import { Decimal } from 'decimal.js';

import { d } from './numbers';
import { RESOURCES_ACCOUNT } from '../constants';
import { is_sorted, composeType } from './contracts';

/**
 * Calculate return of Liquidity Coins
 * @param x {number} - x coin value with slippage
 * @param y {number} - y coin value with slippage
 * @param xReserve {number} - x coin reserves
 * @param yReserve {number} - y coin reserves
 * @param lpSupply {number} - liquidity pool supply value
 */
const MINIMAL_LIQUIDITY = 10000;

export function calcReceivedLP({
  x,
  y,
  xReserve,
  yReserve,
  lpSupply,
}: {
  x: number;
  y: number;
  xReserve: Decimal;
  yReserve: Decimal;
  lpSupply?: number;
}): string {
  const dxReserve = d(xReserve);
  const dyReserve = d(yReserve);
  const dx = d(x);
  const dy = d(y);
  const dSupply = d(lpSupply);

  if (dxReserve.eq(0) || dyReserve.eq(0)) {
    return Decimal.sqrt(dx.mul(dy)).minus(MINIMAL_LIQUIDITY).toFixed(0);
  }

  const xLp = dx.mul(dSupply).div(dxReserve);
  const yLp = dy.mul(dSupply).div(dyReserve);

  return Decimal.min(xLp, yLp).toFixed(0);
}

/**
 * Calculate output amount after burned
 * @param {number} xReserve - first coin reserves
 * @param {number} yReserve - second coin reserves
 * @param {number} lpSupply - liquidity pool supply value
 * @param {number} toBurn - burn amount
 */
export function calcOutputBurnLiquidity({
  xReserve,
  yReserve,
  lpSupply,
  toBurn,
}: {
  xReserve: Decimal;
  yReserve: Decimal;
  lpSupply: Decimal;
  toBurn: Decimal;
}) {
  const xReturn = toBurn.mul(xReserve).div(lpSupply);
  const yReturn = toBurn.mul(yReserve).div(lpSupply);

  if (xReturn.eq(0) || yReturn.eq(0)) {
    return undefined;
  }

  return {
    x: xReturn,
    y: yReturn,
  };
}

export function getOptimalLiquidityAmount(
  xDesired: Decimal,
  xReserve: Decimal,
  yReserve: Decimal,
): Decimal {
  return xDesired.mul(yReserve).div(xReserve);
}

export function getPoolLpStr(
  coinX: string,
  coinY: string,
  curve: string,
): string {
  const [sortedX, sortedY] = is_sorted(coinX, coinY)
    ? [coinX, coinY]
    : [coinY, coinX];
  return composeType(
    //
    RESOURCES_ACCOUNT,
    'lp_coin',
    'LP',
    [sortedX, sortedY, curve],
  );
}

export function getPoolStr(
  coinX: string,
  coinY: string,
  curve: string,
  modulesLiquidityPool: string,
): string {
  const [sortedX, sortedY] = is_sorted(coinX, coinY)
    ? [coinX, coinY]
    : [coinY, coinX];
  return composeType(modulesLiquidityPool, [sortedX, sortedY, curve]);
}
