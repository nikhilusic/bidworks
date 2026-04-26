import { deriveRateYear } from '../../infrastructure/pricing/PriceCardProvider.js';

export class PricingYearResolver {
  resolveYear(startPeriod: string | null | undefined): number {
    return deriveRateYear(startPeriod);
  }
}
