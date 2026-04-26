import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { NotFoundError } from '../../../../shared/errors/domain-error.js';

export interface EstimateSummary {
  estimateId: string;
  totalSolutionComponents: number;
  totalModules: number;
  totalTasks: number;
  totalEffortByRoleType: Array<{
    roleTypeId: string;
    roleTypeName: string;
    effortHours: number;
  }>;
  overallEffortHours: number;
  overallCostEur: number;
}

export class GetEstimateSummary {
  constructor(private readonly db: PrismaClient) {}

  async execute(estimateId: string, projectId: string): Promise<EstimateSummary> {
    const estimate = await this.db.estimate.findUnique({
      where: { id: estimateId },
      include: {
        solutionPhases: {
          include: {
            modules: {
              include: {
                tasks: {
                  include: {
                    effortEntries: {
                      include: { roleType: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!estimate || estimate.projectId !== projectId) {
      throw new NotFoundError('Estimate', estimateId);
    }

    let totalModules = 0;
    let totalTasks = 0;
    let overallEffortHours = new Decimal(0);
    let overallCostEur = new Decimal(0);
    const effortByRole = new Map<string, { name: string; hours: Decimal }>();

    for (const phase of estimate.solutionPhases) {
      for (const mod of phase.modules) {
        totalModules++;
        for (const task of mod.tasks) {
          totalTasks++;
          if (!task.isEnabled) continue;
          const rep = new Decimal(task.repetitionCount);
          for (const entry of task.effortEntries) {
            const hours = new Decimal(entry.effortHours.toString()).times(rep);
            const cost = new Decimal(entry.costEur.toString()).times(rep);
            overallEffortHours = overallEffortHours.plus(hours);
            overallCostEur = overallCostEur.plus(cost);

            const existing = effortByRole.get(entry.roleTypeId);
            if (existing) {
              existing.hours = existing.hours.plus(hours);
            } else {
              effortByRole.set(entry.roleTypeId, { name: entry.roleType.name, hours });
            }
          }
        }
      }
    }

    return {
      estimateId,
      totalSolutionComponents: estimate.solutionPhases.length,
      totalModules,
      totalTasks,
      totalEffortByRoleType: Array.from(effortByRole.entries()).map(([roleTypeId, data]) => ({
        roleTypeId,
        roleTypeName: data.name,
        effortHours: data.hours.toNumber(),
      })),
      overallEffortHours: overallEffortHours.toNumber(),
      overallCostEur: overallCostEur.toNumber(),
    };
  }
}
