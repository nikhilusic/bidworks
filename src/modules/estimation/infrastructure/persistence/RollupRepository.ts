import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

export interface RollupData {
  estimateId: string;
  totalEffortHours: Decimal;
  totalCostEur: Decimal;
  phaseRollups: Array<{ phaseId: string; totalEffortHours: Decimal; totalCostEur: Decimal }>;
  moduleRollups: Array<{ moduleId: string; totalEffortHours: Decimal; totalCostEur: Decimal }>;
}

export class RollupRepository {
  constructor(private readonly db: PrismaClient) {}

  async persist(data: RollupData): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.estimate.update({
        where: { id: data.estimateId },
        data: {
          totalEffortHours: data.totalEffortHours,
          totalCostEur: data.totalCostEur,
        },
      });

      for (const phase of data.phaseRollups) {
        await tx.solutionPhase.update({
          where: { id: phase.phaseId },
          data: {
            totalEffortHours: phase.totalEffortHours,
            totalCostEur: phase.totalCostEur,
          },
        });
      }

      for (const mod of data.moduleRollups) {
        await tx.module.update({
          where: { id: mod.moduleId },
          data: {
            totalEffortHours: mod.totalEffortHours,
            totalCostEur: mod.totalCostEur,
          },
        });
      }
    });
  }
}
