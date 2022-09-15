import { AptosResourceType } from "../types/aptos";
import { checkAddress } from "./hex";

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
  let i = 0;
  while (i < symbolX.length && i < symbolY.length) {
    const elem_cmp = cmp(symbolX.charCodeAt(i), symbolY.charCodeAt(i));
    if (elem_cmp != EQUAL) return elem_cmp;
    i++;
  }
  const lenCmp = cmp(symbolX.length, symbolY.length);
  return lenCmp;
}

export function isSortedSymbols(symbolX: string, symbolY: string) {
  return compare(symbolX, symbolY) === LESS_THAN;
}

export function composeType(address: string, generics: AptosResourceType[]): AptosResourceType;
export function composeType(
  address: string,
  struct: string,
  generics?: AptosResourceType[]
): AptosResourceType;
export function composeType(
  address: string,
  module: string,
  struct: string,
  generics?: AptosResourceType[]
): AptosResourceType;
export function composeType(address: string, ...args: unknown[]): AptosResourceType {
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

export function extractAddressFromType(type: string) {
  return type.split('::')[0];
}

export function checkAptosType(
  type: any,
  options: { leadingZero: boolean } = { leadingZero: true }
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
    /(\w+::\w+::\w+)(?:<.*?>(?!>))?/g
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
