import Decimal from 'decimal.js';

export function d(value?: Decimal.Value): Decimal.Instance {
  if (Decimal.isDecimal(value)) {
    return value as Decimal;
  }
  return new Decimal(value === undefined ? 0 : value);
}

export function decimalsMultiplier(decimals?: Decimal.Value): Decimal.Instance {
  return d(10).pow(d(decimals).abs());
}

export function convertValueToDecimal(
  value: number | string,
  decimals: number | undefined = 0,
) {
  const mul = decimalsMultiplier(decimals);

  return d(value).mul(mul);
}

export function convertDecimalToFixedString(value: Decimal, decimals: number) {
  const mul = decimalsMultiplier(decimals);

  return value.div(mul).toFixed(decimals);
}
