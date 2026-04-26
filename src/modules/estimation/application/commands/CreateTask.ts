import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { EstimateRepository, EstimateWithRelations } from '../../domain/services/EstimateRepository.js';
import { RoleSelectionGuard } from '../../domain/services/RoleSelectionGuard.js';
import { PriceCardProvider, deriveRateYear } from '../../infrastructure/pricing/PriceCardProvider.js';
import { RevisionGuard } from './RevisionGuard.js';
import { NotFoundError } from '../../../../shared/errors/domain-error.js';

export interface CreateTaskCommand {
  estimateId: string;
  revision: number;
  solutionPhaseName: string;
  moduleName: string;
  title: string;
  description: string;
  repetitionCount: number;
  effortEntries: Array<{ roleTypeId: string; effortHours: number }>;
  updatedBy: string;
}

export class CreateTask {
  constructor(
    private readonly db: PrismaClient,
    private readonly estimateRepo: EstimateRepository,
    private readonly roleSelectionGuard: RoleSelectionGuard,
    private readonly priceCardProvider: PriceCardProvider,
    private readonly revisionGuard: RevisionGuard,
  ) {}

  async execute(command: CreateTaskCommand): Promise<EstimateWithRelations> {
    const estimate = await this.estimateRepo.findById(command.estimateId);
    if (!estimate) {
      throw new NotFoundError('Estimate', command.estimateId);
    }

    this.revisionGuard.check(estimate.revision, command.revision);

    const roleTypeIds = command.effortEntries.map((e) => e.roleTypeId);
    if (roleTypeIds.length > 0) {
      await this.roleSelectionGuard.assertRolesSelected(command.estimateId, roleTypeIds);
    }

    const rateYear = deriveRateYear(estimate.startPeriod);

    // Get or create solution phase
    let solutionPhase = await this.db.solutionPhase.findUnique({
      where: { estimateId_name: { estimateId: command.estimateId, name: command.solutionPhaseName } },
    });
    if (!solutionPhase) {
      solutionPhase = await this.db.solutionPhase.create({
        data: { estimateId: command.estimateId, name: command.solutionPhaseName },
      });
    }

    // Get or create module
    let module = await this.db.module.findUnique({
      where: { solutionPhaseId_name: { solutionPhaseId: solutionPhase.id, name: command.moduleName } },
    });
    if (!module) {
      module = await this.db.module.create({
        data: { solutionPhaseId: solutionPhase.id, name: command.moduleName },
      });
    }

    // Resolve rates and build effort entries
    const resolvedEntries = await Promise.all(
      command.effortEntries.map(async (entry) => {
        const hourlyRateEur = await this.priceCardProvider.getRateForYear(entry.roleTypeId, rateYear);
        const effortHours = new Decimal(entry.effortHours);
        const costEur = effortHours.times(hourlyRateEur).toDecimalPlaces(2);
        return { roleTypeId: entry.roleTypeId, effortHours, hourlyRateEur, costEur };
      }),
    );

    // Calculate task totals
    const repetition = new Decimal(command.repetitionCount);
    const taskTotalHours = resolvedEntries.reduce(
      (sum, e) => sum.plus(e.effortHours.times(repetition)),
      new Decimal(0),
    );
    const taskTotalCost = resolvedEntries.reduce(
      (sum, e) => sum.plus(e.costEur.times(repetition)),
      new Decimal(0),
    );

    await this.db.task.create({
      data: {
        moduleId: module.id,
        title: command.title,
        description: command.description,
        repetitionCount: command.repetitionCount,
        isEnabled: true,
        totalEffortHours: taskTotalHours,
        totalCostEur: taskTotalCost,
        effortEntries: {
          create: resolvedEntries.map((e) => ({
            roleTypeId: e.roleTypeId,
            effortHours: e.effortHours,
            hourlyRateEur: e.hourlyRateEur,
            costEur: e.costEur,
          })),
        },
      },
    });

    // Recalculate estimate and return updated
    return this.recalculateAndReturn(command.estimateId, command.updatedBy, command.revision);
  }

  private async recalculateAndReturn(
    estimateId: string,
    updatedBy: string,
    revision: number,
  ): Promise<EstimateWithRelations> {
    const updated = await this.estimateRepo.findById(estimateId);
    if (!updated) throw new NotFoundError('Estimate', estimateId);

    const { total } = computeTotals(updated.solutionPhases);

    // Update module and phase roll-ups
    for (const phase of updated.solutionPhases) {
      let phaseHours = new Decimal(0);
      let phaseCost = new Decimal(0);
      for (const mod of phase.modules) {
        let modHours = new Decimal(0);
        let modCost = new Decimal(0);
        for (const task of mod.tasks) {
          if (!task.isEnabled) continue;
          const rep = new Decimal(task.repetitionCount);
          for (const entry of task.effortEntries) {
            modHours = modHours.plus(new Decimal(entry.effortHours.toString()).times(rep));
            modCost = modCost.plus(new Decimal(entry.costEur.toString()).times(rep));
          }
        }
        await this.db.module.update({
          where: { id: mod.id },
          data: { totalEffortHours: modHours, totalCostEur: modCost },
        });
        phaseHours = phaseHours.plus(modHours);
        phaseCost = phaseCost.plus(modCost);
      }
      await this.db.solutionPhase.update({
        where: { id: phase.id },
        data: { totalEffortHours: phaseHours, totalCostEur: phaseCost },
      });
    }

    return this.estimateRepo.update(estimateId, {
      updatedBy,
      revision,
      totalEffortHours: total.hours,
      totalCostEur: total.cost,
    });
  }
}

function computeTotals(phases: EstimateWithRelations['solutionPhases']): {
  total: { hours: Decimal; cost: Decimal };
} {
  let hours = new Decimal(0);
  let cost = new Decimal(0);
  for (const phase of phases) {
    for (const mod of phase.modules) {
      for (const task of mod.tasks) {
        if (!task.isEnabled) continue;
        const rep = new Decimal(task.repetitionCount);
        for (const entry of task.effortEntries) {
          hours = hours.plus(new Decimal(entry.effortHours.toString()).times(rep));
          cost = cost.plus(new Decimal(entry.costEur.toString()).times(rep));
        }
      }
    }
  }
  return { total: { hours, cost } };
}
