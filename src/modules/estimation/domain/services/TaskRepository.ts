import { Task, TaskEffortEntry } from '@prisma/client';

export type TaskWithEffortEntries = Task & {
  effortEntries: TaskEffortEntry[];
};

export interface TaskRepository {
  findById(taskId: string): Promise<TaskWithEffortEntries | null>;
  findByEstimateId(estimateId: string): Promise<TaskWithEffortEntries[]>;
  create(data: {
    moduleId: string;
    title: string;
    description: string;
    repetitionCount: number;
    effortEntries: Array<{
      roleTypeId: string;
      effortHours: import('decimal.js').Decimal;
      hourlyRateEur: import('decimal.js').Decimal;
      costEur: import('decimal.js').Decimal;
    }>;
  }): Promise<TaskWithEffortEntries>;
  update(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      repetitionCount?: number;
      isEnabled?: boolean;
      totalEffortHours?: import('decimal.js').Decimal;
      totalCostEur?: import('decimal.js').Decimal;
      effortEntries?: Array<{
        roleTypeId: string;
        effortHours: import('decimal.js').Decimal;
        hourlyRateEur: import('decimal.js').Decimal;
        costEur: import('decimal.js').Decimal;
      }>;
    },
  ): Promise<TaskWithEffortEntries>;
}
