import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { TaskRepository, TaskWithEffortEntries } from '../../domain/services/TaskRepository.js';
import { NotFoundError } from '../../../../shared/errors/domain-error.js';

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(taskId: string): Promise<TaskWithEffortEntries | null> {
    return this.db.task.findUnique({
      where: { id: taskId },
      include: { effortEntries: true },
    });
  }

  async findByEstimateId(estimateId: string): Promise<TaskWithEffortEntries[]> {
    return this.db.task.findMany({
      where: {
        module: {
          solutionPhase: { estimateId },
        },
      },
      include: { effortEntries: true },
    });
  }

  async create(data: {
    moduleId: string;
    title: string;
    description: string;
    repetitionCount: number;
    effortEntries: Array<{
      roleTypeId: string;
      effortHours: Decimal;
      hourlyRateEur: Decimal;
      costEur: Decimal;
    }>;
  }): Promise<TaskWithEffortEntries> {
    const totalEffortHours = data.effortEntries.reduce(
      (sum, e) => sum.plus(e.effortHours.times(data.repetitionCount)),
      new Decimal(0),
    );
    const totalCostEur = data.effortEntries.reduce(
      (sum, e) => sum.plus(e.costEur.times(data.repetitionCount)),
      new Decimal(0),
    );

    return this.db.task.create({
      data: {
        moduleId: data.moduleId,
        title: data.title,
        description: data.description,
        repetitionCount: data.repetitionCount,
        isEnabled: true,
        totalEffortHours,
        totalCostEur,
        effortEntries: {
          create: data.effortEntries.map((e) => ({
            roleTypeId: e.roleTypeId,
            effortHours: e.effortHours,
            hourlyRateEur: e.hourlyRateEur,
            costEur: e.costEur,
          })),
        },
      },
      include: { effortEntries: true },
    });
  }

  async update(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      repetitionCount?: number;
      isEnabled?: boolean;
      totalEffortHours?: Decimal;
      totalCostEur?: Decimal;
      effortEntries?: Array<{
        roleTypeId: string;
        effortHours: Decimal;
        hourlyRateEur: Decimal;
        costEur: Decimal;
      }>;
    },
  ): Promise<TaskWithEffortEntries> {
    const existing = await this.db.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      throw new NotFoundError('Task', taskId);
    }

    return this.db.$transaction(async (tx) => {
      if (data.effortEntries !== undefined) {
        await tx.taskEffortEntry.deleteMany({ where: { taskId } });
        if (data.effortEntries.length > 0) {
          await tx.taskEffortEntry.createMany({
            data: data.effortEntries.map((e) => ({
              taskId,
              roleTypeId: e.roleTypeId,
              effortHours: e.effortHours,
              hourlyRateEur: e.hourlyRateEur,
              costEur: e.costEur,
            })),
          });
        }
      }

      return tx.task.update({
        where: { id: taskId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.repetitionCount !== undefined && { repetitionCount: data.repetitionCount }),
          ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
          ...(data.totalEffortHours !== undefined && { totalEffortHours: data.totalEffortHours }),
          ...(data.totalCostEur !== undefined && { totalCostEur: data.totalCostEur }),
        },
        include: { effortEntries: true },
      });
    });
  }
}
