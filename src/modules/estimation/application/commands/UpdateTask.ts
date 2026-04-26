import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { EstimateRepository, EstimateWithRelations } from '../../domain/services/EstimateRepository.js';
import { RoleSelectionGuard } from '../../domain/services/RoleSelectionGuard.js';
import { PriceCardProvider, deriveRateYear } from '../../infrastructure/pricing/PriceCardProvider.js';
import { RevisionGuard } from './RevisionGuard.js';
import { NotFoundError } from '../../../../shared/errors/domain-error.js';
import { Task, TaskEffortEntry } from '@prisma/client';

export interface UpdateTaskCommand {
  estimateId: string;
  taskId: string;
  revision: number;
  title?: string;
  description?: string;
  repetitionCount?: number;
  isEnabled?: boolean;
  effortEntries?: Array<{ roleTypeId: string; effortHours: number }>;
  updatedBy: string;
}

export class UpdateTask {
  constructor(
    private readonly db: PrismaClient,
    private readonly estimateRepo: EstimateRepository,
    private readonly roleSelectionGuard: RoleSelectionGuard,
    private readonly priceCardProvider: PriceCardProvider,
    private readonly revisionGuard: RevisionGuard,
  ) {}

  async execute(command: UpdateTaskCommand): Promise<{ task: Task & { effortEntries: TaskEffortEntry[] }; estimate: EstimateWithRelations }> {
    const estimate = await this.estimateRepo.findById(command.estimateId);
    if (!estimate) {
      throw new NotFoundError('Estimate', command.estimateId);
    }

    this.revisionGuard.check(estimate.revision, command.revision);

    const task = await this.db.task.findUnique({
      where: { id: command.taskId },
      include: { effortEntries: true },
    });
    if (!task) {
      throw new NotFoundError('Task', command.taskId);
    }

    if (command.effortEntries !== undefined && command.effortEntries.length > 0) {
      const roleTypeIds = command.effortEntries.map((e) => e.roleTypeId);
      await this.roleSelectionGuard.assertRolesSelected(command.estimateId, roleTypeIds);
    }

    const rateYear = deriveRateYear(estimate.startPeriod);

    let resolvedEntries:
      | Array<{ roleTypeId: string; effortHours: Decimal; hourlyRateEur: Decimal; costEur: Decimal }>
      | undefined;

    if (command.effortEntries !== undefined) {
      resolvedEntries = await Promise.all(
        command.effortEntries.map(async (entry) => {
          const hourlyRateEur = await this.priceCardProvider.getRateForYear(entry.roleTypeId, rateYear);
          const effortHours = new Decimal(entry.effortHours);
          const costEur = effortHours.times(hourlyRateEur).toDecimalPlaces(2);
          return { roleTypeId: entry.roleTypeId, effortHours, hourlyRateEur, costEur };
        }),
      );
    }

    const repetitionCount = command.repetitionCount ?? task.repetitionCount;
    const isEnabled = command.isEnabled ?? task.isEnabled;
    const entriesToUse = resolvedEntries ?? (task.effortEntries as any[]).map((e: any) => ({
      roleTypeId: e.roleTypeId,
      effortHours: new Decimal(e.effortHours.toString()),
      hourlyRateEur: new Decimal(e.hourlyRateEur.toString()),
      costEur: new Decimal(e.costEur.toString()),
    }));

    let totalEffortHours = new Decimal(0);
    let totalCostEur = new Decimal(0);

    if (isEnabled) {
      const rep = new Decimal(repetitionCount);
      for (const e of entriesToUse) {
        totalEffortHours = totalEffortHours.plus(e.effortHours.times(rep));
        totalCostEur = totalCostEur.plus(e.costEur.times(rep));
      }
    }

    // Update effort entries if provided
    if (resolvedEntries !== undefined) {
      await this.db.$transaction([
        this.db.taskEffortEntry.deleteMany({ where: { taskId: command.taskId } }),
        this.db.taskEffortEntry.createMany({
          data: resolvedEntries.map((e) => ({
            taskId: command.taskId,
            roleTypeId: e.roleTypeId,
            effortHours: e.effortHours,
            hourlyRateEur: e.hourlyRateEur,
            costEur: e.costEur,
          })),
        }),
      ]);
    }

    const updatedTask = await this.db.task.update({
      where: { id: command.taskId },
      data: {
        ...(command.title !== undefined && { title: command.title }),
        ...(command.description !== undefined && { description: command.description }),
        ...(command.repetitionCount !== undefined && { repetitionCount: command.repetitionCount }),
        ...(command.isEnabled !== undefined && { isEnabled: command.isEnabled }),
        totalEffortHours,
        totalCostEur,
      },
      include: { effortEntries: true },
    });

    // Recalculate roll-ups
    const updatedEstimate = await this.recalculateRollups(command.estimateId, command.updatedBy, command.revision);

    return { task: updatedTask, estimate: updatedEstimate };
  }

  private async recalculateRollups(
    estimateId: string,
    updatedBy: string,
    revision: number,
  ): Promise<EstimateWithRelations> {
    const current = await this.estimateRepo.findById(estimateId);
    if (!current) throw new NotFoundError('Estimate', estimateId);

    let estimateHours = new Decimal(0);
    let estimateCost = new Decimal(0);

    for (const phase of current.solutionPhases) {
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
      estimateHours = estimateHours.plus(phaseHours);
      estimateCost = estimateCost.plus(phaseCost);
    }

    return this.estimateRepo.update(estimateId, {
      updatedBy,
      revision,
      totalEffortHours: estimateHours,
      totalCostEur: estimateCost,
    });
  }
}
