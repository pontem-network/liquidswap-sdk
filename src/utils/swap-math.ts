import Decimal from 'decimal.js';
import { d } from '../utils';

const e8 = new Decimal('100000000');
const DENOMINATOR = new Decimal(10000);

/**
 * Calculates rate with uncorrelated curve for 'to' input  based on 'from' input
 *
 * @param {Decimal} coinInVal - amount of first('from') token
 * @param {Decimal} reserveInSize - amount of reserves for first('from') token
 * @param {Decimal} reserveOutSize - amount of reserves for second('to') token
 * @param {Decimal} fee - amount of fee
 */
export function getCoinOutWithFees(
  coinInVal: Decimal,
  reserveInSize: Decimal,
  reserveOutSize: Decimal,
  fee: Decimal,
): Decimal {
  const { feePct, feeScale } = { feePct: fee, feeScale: d(DENOMINATOR) };
  const feeMultiplier = feeScale.minus(feePct);
  const coinInAfterFees = coinInVal.mul(feeMultiplier);
  const newReservesInSize = reserveInSize.mul(feeScale).plus(coinInAfterFees);
  return coinInAfterFees.mul(reserveOutSize).div(newReservesInSize);
}

/**
 * Calculates rate with uncorrelated curve for 'from' input based on 'to' input
 *
 * @param {Decimal} coinOutVal - amount of second('to') token
 * @param {Decimal} reserveOutSize - amount of reserves for second('to') token
 * @param {Decimal} reserveInSize - amount of reserves for first('from') token
 * @param {Decimal} fee - amount of fee
 */
export function getCoinInWithFees(
  coinOutVal: Decimal,
  reserveOutSize: Decimal,
  reserveInSize: Decimal,
  fee: Decimal,
): Decimal {
  const feeMultiplier = DENOMINATOR.minus(fee);
  const newReservesOutSize = reserveOutSize
    .minus(coinOutVal)
    .mul(feeMultiplier);
  return coinOutVal
    .mul(DENOMINATOR)
    .mul(reserveInSize)
    .div(newReservesOutSize)
    .plus(1);
}

/**
 * Calculates rate with stable curve for 'from' input based on 'to' input
 *
 * @param {Decimal} coinOut - amount of second('to') token
 * @param {Decimal} reserveOut - amount of reserves for second('to') token
 * @param {Decimal} reserveIn - amount of reserves for first('from') token
 * @param {Decimal} scaleOut - precision for the ('to')token in decimal places
 * @param {Decimal} scaleIn - precision for the ('from')token in decimal places
 * @param {Decimal} fee - amount of fee
 */
export function getCoinsInWithFeesStable(
  coinOut: Decimal,
  reserveOut: Decimal,
  reserveIn: Decimal,
  scaleOut: Decimal,
  scaleIn: Decimal,
  fee: Decimal,
): Decimal {
  const r = coin_in(coinOut, scaleOut, scaleIn, reserveOut, reserveIn);
  return r.plus(1).mul(DENOMINATOR).div(DENOMINATOR.minus(fee)).plus(1);
}

/**
 * Calculates coin_in value based on first coin value, scales and reserves
 *
 * @param {Decimal} coinOut - decimal amount of second('to') token
 * @param {Decimal} scaleOut - decimal precision for the ('to')token in decimal places
 * @param {Decimal} scaleIn - decimal precision for the ('from')token in decimal places
 * @param {Decimal} reserveOut - decimal amount of reserves for second('to') token
 * @param {Decimal} reserveIn - decimal amount of reserves for first('from') token
 */
export function coin_in(
  coinOut: Decimal,
  scaleOut: Decimal,
  scaleIn: Decimal,
  reserveOut: Decimal,
  reserveIn: Decimal,
): Decimal {
  const xy = lp_value(reserveIn, scaleIn, reserveOut, scaleOut);

  const reserve_in = reserveIn.mul(e8).div(scaleIn);
  const reserve_out = reserveOut.mul(e8).div(scaleOut);
  const amount_out = coinOut.mul(e8).div(scaleOut);

  const total_reserve = reserve_out.minus(amount_out);
  const x = get_y(total_reserve, xy, reserve_in).minus(reserve_in);
  return x.mul(scaleIn).div(e8);
}

/**
 * Calculates rate with stable curve for 'from' input based on 'to' input
 *
 * @param {Decimal} coinIn - amount of first('from') token
 * @param {Decimal} reserveIn - amount of reserves for first ('from') token
 * @param {Decimal} reserveOut - amount of reserves for second ('to') token
 * @param {Decimal} scaleIn - precision for the ('from') token in decimal places
 * @param {Decimal} scaleOut - precision for the ('to') token in decimal places
 * @param {Decimal} fee - amount of fee
 */
export function getCoinsOutWithFeesStable(
  coinIn: Decimal,
  reserveIn: Decimal,
  reserveOut: Decimal,
  scaleIn: Decimal,
  scaleOut: Decimal,
  fee: Decimal,
): Decimal {
  let coin_in_val_after_fees = new Decimal(0);
  const coin_in_val_scaled = coinIn.mul(DENOMINATOR.minus(fee));
  if (!coin_in_val_scaled.mod(DENOMINATOR).eq(0)) {
    coin_in_val_after_fees = coin_in_val_scaled.div(DENOMINATOR).plus(1);
  } else {
    coin_in_val_after_fees = coin_in_val_scaled.div(DENOMINATOR);
  }
  return coin_out(
    coin_in_val_after_fees,
    scaleIn,
    scaleOut,
    reserveIn,
    reserveOut,
  );
}

/**
 * Calculates coin_out value based on second coin value, scales and reserves
 *
 * @param {Decimal} coinOut - decimal amount of first('from') token
 * @param {Decimal} scaleOut - decimal precision for the ('to')token in decimal places
 * @param {Decimal} scaleIn - precision for the ('from')token in decimal places
 * @param {Decimal} reserveOut - decimal amount of reserves for second('to') token
 * @param {Decimal} reserveIn - amount of reserves for first('from') token
 */
export function coin_out(
  coinIn: Decimal,
  scaleIn: Decimal,
  scaleOut: Decimal,
  reserveIn: Decimal,
  reserveOut: Decimal,
): Decimal {
  const xy = lp_value(reserveIn, scaleIn, reserveOut, scaleOut);

  const reserve_in = reserveIn.mul(e8).div(scaleIn);
  const reserve_out = reserveOut.mul(e8).dividedBy(scaleOut);
  const amount_in = coinIn.mul(e8).div(scaleIn);
  const total_reserve = amount_in.plus(reserve_in);
  const y = reserve_out.minus(get_y(total_reserve, xy, reserve_out));
  return y.mul(scaleOut).div(e8);
}

/**
 * Calculates diff of reserves for opposite token
 *
 * @param {Decimal} x0 - Decimal amount of total reserves for target token
 * @param {Decimal} xy - Decimal value of inner liquid pool
 * @param {Decimal} y - Decimal amount of reserves for opposite token
 */
export function get_y(x0: Decimal, xy: Decimal, y: Decimal): Decimal {
  let i = 0;
  while (i < 255) {
    const k = f(x0, y);

    let dy = new Decimal(0);
    if (k.lt(xy)) {
      dy = xy.minus(k).div(dStable(x0, y)).plus(1);
      y = y.plus(dy);
    } else {
      dy = k.minus(xy).dividedBy(dStable(x0, y));
      y = y.minus(dy);
    }

    if (dy.lte(1)) {
      return y;
    }

    i++;
  }
  return y;
}

/**
 * f function accepts a and b and returns(a^3 * b + b^3 * a)
 *
 * @param {Decimal} x0 - Decimal amount of total reserves for target token
 * @param {Decimal} y - Decimal amount of reserves for opposite token
 */
export function f(x0: Decimal, y: Decimal): Decimal {
  const yyy = y.mul(y).mul(y);
  const a = x0.mul(yyy);
  const xxx = x0.mul(x0).mul(x0);
  const b = xxx.mul(y);
  return a.plus(b);
}

/**
 * Calculates inner liquid pool value based on reserves and precisions of both tokens
 *
 * @param {Decimal} x_coin - amount of reserves for first('from') token
 * @param {Decimal} x_scale - precision for the ('from')token in decimal places
 * @param {Decimal} y_coin - amount of reserves for second('to') token
 * @param {Decimal} y_scale - precision for the ('to')token in decimal places
 */
export function lp_value(
  x_coin: Decimal,
  x_scale: Decimal,
  y_coin: Decimal,
  y_scale: Decimal,
): Decimal {
  const x = x_coin.mul(e8).div(x_scale);
  const y = y_coin.mul(e8).div(y_scale);
  const a = x.mul(y);
  const b = x.mul(x).plus(y.mul(y));

  return a.mul(b);
}

/** dStable function accepts a and b and returns (3a * b^2 + a^3)
 *
 *  @param {Decimal} x0 - Decimal amount of total reserves for target token
 *  @param {Decimal} y - Decimal amount of reserves for opposite token
 */
export function dStable(x0: Decimal, y: Decimal): Decimal {
  const x3 = x0.mul(3);
  const yy = y.mul(y);
  const xyy3 = x3.mul(yy);
  const xxx = x0.mul(x0).mul(x0);

  return xyy3.plus(xxx);
}
