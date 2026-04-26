import Decimal from 'decimal.js';

export const toDecimal = (value: number | string | Decimal): Decimal => new Decimal(value);
export const round2 = (value: Decimal): Decimal => value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
