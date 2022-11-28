import { Buffer } from 'buffer';
import Decimal from 'decimal.js';

import { checkAddress } from './hex';

const EQUAL = 0;
const LESS_THAN = 1;
const GREATER_THAN = 2;

function cmp(a: number, b: number) {
  if (a === b) {
    return EQUAL;
  } else if (a < b) {
    return LESS_THAN;
  } else {
    return GREATER_THAN;
  }
}

function compare(symbolX: string, symbolY: string) {
  const lenCmp = cmp(symbolX.length, symbolY.length);
  if (lenCmp != EQUAL) {
    return lenCmp;
  }
  let i = 0;
  while (i < symbolX.length && i < symbolY.length) {
    const elem_cmp = cmp(symbolX.charCodeAt(i), symbolY.charCodeAt(i));
    if (elem_cmp != EQUAL) return elem_cmp;
    i++;
  }
  return EQUAL;
}

function cmp_addresses(a: string, b: string) {
  if (a.startsWith('0x')) {
    a = a.substring(2);
  }

  if (a.length != 64) {
    while (a.length < 64) {
      a = '0' + a;
    }
  }

  if (b.startsWith('0x')) {
    b = b.substring(2);
  }

  if (b.length != 64) {
    while (b.length < 64) {
      b = '0' + b;
    }
  }

  const a_buf = Buffer.from(a, 'hex');
  const b_buf = Buffer.from(b, 'hex');

  for (let i = 0; i < 32; i++) {
    if (a_buf[i] < b_buf[i]) {
      return LESS_THAN;
    } else if (a_buf[i] > b_buf[i]) {
      return GREATER_THAN;
    }
  }

  return EQUAL;
}

function compare_types(coin_x: string, coin_y: string) {
  const coin_x_parts = coin_x.split('::').reverse();
  const coin_y_parts = coin_y.split('::').reverse();

  const coin_x_address = coin_x_parts.pop() as string;
  const coin_y_address = coin_y_parts.pop() as string;

  for (let i = 0; i < 2; i++) {
    const c = compare(coin_x_parts[i], coin_y_parts[i]);
    if (c != EQUAL) {
      return c;
    }
  }

  return cmp_addresses(coin_x_address, coin_y_address);
}

/**
 * Compare sorting between two coin types
 *
 * @param coin_x string with full address of coin
 * @param coin_y string with full address of coin
 * @returns boolean
 */
export function is_sorted(coin_x: string, coin_y: string) {
  return compare_types(coin_x, coin_y) == LESS_THAN;
}

export function composeType(address: string, generics: string[]): string;

export function composeType(
  address: string,
  struct: string,
  generics?: string[],
): string;

export function composeType(
  address: string,
  module: string,
  struct: string,
  generics?: string[],
): string;

export function composeType(address: string, ...args: unknown[]): string {
  const generics: string[] = Array.isArray(args[args.length - 1])
    ? (args.pop() as string[])
    : [];
  const chains = [address, ...args].filter(Boolean);

  let result: string = chains.join('::');

  if (generics && generics.length) {
    result += `<${generics.join(',')}>`;
  }

  return result;
}

/**
 * Calculate value with slippage.
 * @param {Decimal} slippage - slippage refers to the difference between the expected price of a trade
 * and the price at which the trade is executed.
 * @param {Decimal} value - value to calculate slippage
 */
export function withSlippage(
  slippage: Decimal,
  value: Decimal,
  isPlussed: boolean,
) {
  const multiply = new Decimal(10000);
  const slippagePercent = slippage.mul(multiply);
  return isPlussed
    ? value.plus(value.mul(slippagePercent).div(multiply)).toNumber()
    : value.minus(value.mul(slippagePercent).div(multiply)).toNumber();
}

export function extractAddressFromType(type: string) {
  return type.split('::')[0];
}

export function checkAptosType(
  type: any,
  options: { leadingZero: boolean } = { leadingZero: true },
): boolean {
  if (typeof type !== 'string') {
    return false;
  }

  let _type = type.replace(/\s/g, '');

  const openBracketsCount = _type.match(/</g)?.length ?? 0;
  const closeBracketsCount = _type.match(/>/g)?.length ?? 0;

  if (openBracketsCount !== closeBracketsCount) {
    return false;
  }

  const genericsString = _type.match(/(<.+>)$/);
  const generics = genericsString?.[1]?.match(
    /(\w+::\w+::\w+)(?:<.*?>(?!>))?/g,
  );

  if (generics) {
    _type = _type.slice(0, _type.indexOf('<'));
    const validGenerics = generics.every((g) => {
      const gOpenCount = g.match(/</g)?.length ?? 0;
      const gCloseCount = g.match(/>/g)?.length ?? 0;
      let t = g;
      if (gOpenCount !== gCloseCount) {
        t = t.slice(0, -(gCloseCount - gOpenCount));
      }

      return checkAptosType(t, options);
    });

    if (!validGenerics) {
      return false;
    }
  }

  const parts = _type.split('::');
  if (parts.length !== 3) {
    return false;
  }

  return (
    checkAddress(parts[0], options) &&
    parts[1].length >= 1 &&
    parts[2].length >= 1
  );
}
