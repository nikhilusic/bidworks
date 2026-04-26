import { TaskEffortEntry as PrismaTaskEffortEntry } from '@prisma/client';

export interface TaskEffortEntryProps {
  id: string;
  taskId: string;
  roleTypeId: string;
  effortHours: number;
  hourlyRateEur: number;
  costEur: number;
}

export function mapEffortEntryToResponse(entry: PrismaTaskEffortEntry): TaskEffortEntryProps {
  return {
    id: entry.id,
    taskId: entry.taskId,
    roleTypeId: entry.roleTypeId,
    effortHours: parseFloat(entry.effortHours.toString()),
    hourlyRateEur: parseFloat(entry.hourlyRateEur.toString()),
    costEur: parseFloat(entry.costEur.toString()),
  };
}
