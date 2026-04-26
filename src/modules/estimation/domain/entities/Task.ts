import { Task as PrismaTask, TaskEffortEntry } from '@prisma/client';

export interface TaskProps {
  id: string;
  solutionPhase?: string;
  module?: string;
  title: string;
  description: string;
  isEnabled: boolean;
  repetitionCount: number;
  totalEffortHours: number;
  totalCostEur: number;
}

export function mapTaskToResponse(
  task: PrismaTask & { effortEntries: TaskEffortEntry[] },
  solutionPhase?: string,
  module?: string,
): TaskProps {
  return {
    id: task.id,
    solutionPhase,
    module,
    title: task.title,
    description: task.description,
    isEnabled: task.isEnabled,
    repetitionCount: task.repetitionCount,
    totalEffortHours: parseFloat(task.totalEffortHours.toString()),
    totalCostEur: parseFloat(task.totalCostEur.toString()),
  };
}
