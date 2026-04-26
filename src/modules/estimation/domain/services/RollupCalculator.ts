import { Decimal } from 'decimal.js';
import { TaskEffortEntry, Task, Module, SolutionPhase } from '@prisma/client';

export type TaskWithEntries = Task & { effortEntries: TaskEffortEntry[] };
export type ModuleWithTasks = Module & { tasks: TaskWithEntries[] };
export type PhaseWithModules = SolutionPhase & { modules: ModuleWithTasks[] };

export interface TaskRollup {
  taskId: string;
  totalEffortHours: Decimal;
  totalCostEur: Decimal;
}

export interface ModuleRollup {
  moduleId: string;
  totalEffortHours: Decimal;
  totalCostEur: Decimal;
}

export interface PhaseRollup {
  phaseId: string;
  totalEffortHours: Decimal;
  totalCostEur: Decimal;
}

export interface EstimateRollup {
  totalEffortHours: Decimal;
  totalCostEur: Decimal;
  taskRollups: TaskRollup[];
  moduleRollups: ModuleRollup[];
  phaseRollups: PhaseRollup[];
}

export class RollupCalculator {
  calculate(phases: PhaseWithModules[]): EstimateRollup {
    const taskRollups: TaskRollup[] = [];
    const moduleRollups: ModuleRollup[] = [];
    const phaseRollups: PhaseRollup[] = [];

    let estimateTotalHours = new Decimal(0);
    let estimateTotalCost = new Decimal(0);

    for (const phase of phases) {
      let phaseTotalHours = new Decimal(0);
      let phaseTotalCost = new Decimal(0);

      for (const module of phase.modules) {
        let moduleTotalHours = new Decimal(0);
        let moduleTotalCost = new Decimal(0);

        for (const task of module.tasks) {
          const taskRollup = this.calculateTask(task);
          taskRollups.push(taskRollup);
          moduleTotalHours = moduleTotalHours.plus(taskRollup.totalEffortHours);
          moduleTotalCost = moduleTotalCost.plus(taskRollup.totalCostEur);
        }

        moduleRollups.push({
          moduleId: module.id,
          totalEffortHours: moduleTotalHours,
          totalCostEur: moduleTotalCost,
        });

        phaseTotalHours = phaseTotalHours.plus(moduleTotalHours);
        phaseTotalCost = phaseTotalCost.plus(moduleTotalCost);
      }

      phaseRollups.push({
        phaseId: phase.id,
        totalEffortHours: phaseTotalHours,
        totalCostEur: phaseTotalCost,
      });

      estimateTotalHours = estimateTotalHours.plus(phaseTotalHours);
      estimateTotalCost = estimateTotalCost.plus(phaseTotalCost);
    }

    return {
      totalEffortHours: estimateTotalHours,
      totalCostEur: estimateTotalCost,
      taskRollups,
      moduleRollups,
      phaseRollups,
    };
  }

  private calculateTask(task: TaskWithEntries): TaskRollup {
    if (!task.isEnabled) {
      return {
        taskId: task.id,
        totalEffortHours: new Decimal(0),
        totalCostEur: new Decimal(0),
      };
    }

    const repetition = new Decimal(task.repetitionCount);
    let totalHours = new Decimal(0);
    let totalCost = new Decimal(0);

    for (const entry of task.effortEntries) {
      totalHours = totalHours.plus(new Decimal(entry.effortHours.toString()).times(repetition));
      totalCost = totalCost.plus(new Decimal(entry.costEur.toString()).times(repetition));
    }

    return {
      taskId: task.id,
      totalEffortHours: totalHours,
      totalCostEur: totalCost,
    };
  }
}
