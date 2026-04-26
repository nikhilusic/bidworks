import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

export interface PriceRate {
  hourlyRateEur: Decimal;
}

export class PriceCardProvider {
  constructor(private readonly db: PrismaClient) {}

  async getRateForYear(roleTypeId: string, rateYear: number): Promise<Decimal> {
    // Try exact year first
    const exact = await this.db.priceCardRate.findUnique({
      where: { roleTypeId_rateYear: { roleTypeId, rateYear } },
    });
    if (exact) {
      return new Decimal(exact.hourlyRateEur.toString());
    }

    // Find the most recent rate and apply annual increments
    const latestRate = await this.db.priceCardRate.findFirst({
      where: { roleTypeId, rateYear: { lt: rateYear } },
      orderBy: { rateYear: 'desc' },
    });

    if (!latestRate) {
      throw new Error(`No price card rate found for roleTypeId=${roleTypeId} up to year ${rateYear}`);
    }

    const yearDiff = rateYear - latestRate.rateYear;
    // Each year adds 2.00 EUR per hour (annual increment rule)
    const increment = new Decimal(2.0).times(yearDiff);
    return new Decimal(latestRate.hourlyRateEur.toString()).plus(increment);
  }
}

export function deriveRateYear(startPeriod: string | null | undefined): number {
  if (!startPeriod) {
    return new Date().getFullYear();
  }
  const year = parseInt(startPeriod.substring(0, 4), 10);
  return isNaN(year) ? new Date().getFullYear() : year;
}
