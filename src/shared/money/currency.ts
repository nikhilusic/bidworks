// eslint-disable-next-line @typescript-eslint/no-var-requires
const Decimal = require('decimal.js');

export function toDecimal(value: number | string | object): object {
  return new Decimal(value);
}

export function round2(value: object): object {
  // Round to 2 decimal places (mode 4 = ROUND_HALF_UP)
  return (value as any).toDecimalPlaces(2, 4);
}
