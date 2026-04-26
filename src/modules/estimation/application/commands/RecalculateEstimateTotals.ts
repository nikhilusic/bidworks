import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { EstimateRepository, EstimateWithRelations } from '../../domain/services/EstimateRepository.js';
import { NotFoundError } from '../../../../shared/errors/domain-error.js';

export class RecalculateEstimateTotals {
  constructor(
    private readonly db: PrismaClient,
    private readonly estimateRepo: EstimateRepository,
  ) {}

  async execute(estimateId: string, updatedBy: string, currentRevision: number): Promise<EstimateWithRelations> {
    const estimate = await this.estimateRepo.findById(estimateId);
    if (!estimate) throw new NotFoundError('Estimate', estimateId);

    let estimateHours = new Decimal(0);
    let estimateCost = new Decimal(0);

    for (const phase of estimate.solutionPhases) {
      let phaseHours = new Decimal(0);
      let phaseCost = new Decimal(0);

      for (const mod of phase.modules) {
        let modHours = new Decimal(0);
        let modCost = new Decimal(0);

        for (const task of mod.tasks) {
          let taskHours = new Decimal(0);
          let taskCost = new Decimal(0);

          if (task.isEnabled) {
            const rep = new Decimal(task.repetitionCount);
            for (const entry of task.effortEntries) {
              taskHours = taskHours.plus(new Decimal(entry.effortHours.toString()).times(rep));
              taskCost = taskCost.plus(new Decimal(entry.costEur.toString()).times(rep));
            }
          }

          await this.db.task.update({
            where: { id: task.id },
            data: { totalEffortHours: taskHours, totalCostEur: taskCost },
          });

          modHours = modHours.plus(taskHours);
          modCost = modCost.plus(taskCost);
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

    const result = await this.estimateRepo.update(estimateId, {
      updatedBy,
      revision: currentRevision,
      totalEffortHours: estimateHours,
      totalCostEur: estimateCost,
    });

    // Observability log for roll-up traceability (T058)
    const logger = { info: (msg: unknown) => process.stdout.write(JSON.stringify(msg) + '\n') };
    logger.info({
      event: 'estimate_recalculated',
      estimateId,
      totalEffortHours: estimateHours.toNumber(),
      totalCostEur: estimateCost.toNumber(),
      updatedBy,
      timestamp: new Date().toISOString(),
    });

    return result;
  }
}
