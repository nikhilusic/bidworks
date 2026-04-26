import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { EstimateRepository, EstimateWithRelations } from '../../domain/services/EstimateRepository.js';
import { ConflictError, NotFoundError } from '../../../../shared/errors/domain-error.js';

export class PrismaEstimateRepository implements EstimateRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(estimateId: string): Promise<EstimateWithRelations | null> {
    return this.db.estimate.findUnique({
      where: { id: estimateId },
      include: {
        roleSelections: true,
        solutionPhases: {
          include: {
            modules: {
              include: {
                tasks: {
                  include: { effortEntries: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByProjectAndName(projectId: string, name: string): Promise<import('@prisma/client').Estimate | null> {
    return this.db.estimate.findUnique({
      where: { projectId_name: { projectId, name } },
    });
  }

  async create(data: {
    projectId: string;
    name: string;
    description: string;
    startPeriod?: string;
    durationMonths?: number;
    createdBy: string;
    updatedBy: string;
  }): Promise<EstimateWithRelations> {
    try {
      return await this.db.estimate.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          description: data.description,
          startPeriod: data.startPeriod,
          durationMonths: data.durationMonths,
          createdBy: data.createdBy,
          updatedBy: data.updatedBy,
          revision: 1,
          status: 'Draft',
        },
        include: {
          roleSelections: true,
          solutionPhases: {
            include: {
              modules: {
                include: {
                  tasks: { include: { effortEntries: true } },
                },
              },
            },
          },
        },
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          'DUPLICATE_ESTIMATE_NAME',
          `Estimate with name '${data.name}' already exists in this project`,
        );
      }
      throw error;
    }
  }

  async update(
    estimateId: string,
    data: {
      name?: string;
      description?: string;
      startPeriod?: string;
      durationMonths?: number;
      updatedBy: string;
      revision: number;
      totalEffortHours?: Decimal;
      totalCostEur?: Decimal;
    },
  ): Promise<EstimateWithRelations> {
    const current = await this.db.estimate.findUnique({ where: { id: estimateId } });
    if (!current) {
      throw new NotFoundError('Estimate', estimateId);
    }
    if (current.revision !== data.revision) {
      throw new ConflictError(
        'REVISION_CONFLICT',
        `Expected revision ${data.revision} but current is ${current.revision}`,
      );
    }

    try {
      return await this.db.estimate.update({
        where: { id: estimateId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.startPeriod !== undefined && { startPeriod: data.startPeriod }),
          ...(data.durationMonths !== undefined && { durationMonths: data.durationMonths }),
          updatedBy: data.updatedBy,
          revision: { increment: 1 },
          ...(data.totalEffortHours !== undefined && { totalEffortHours: data.totalEffortHours }),
          ...(data.totalCostEur !== undefined && { totalCostEur: data.totalCostEur }),
        },
        include: {
          roleSelections: true,
          solutionPhases: {
            include: {
              modules: {
                include: {
                  tasks: { include: { effortEntries: true } },
                },
              },
            },
          },
        },
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          'DUPLICATE_ESTIMATE_NAME',
          `Estimate with name '${data.name ?? ''}' already exists in this project`,
        );
      }
      throw error;
    }
  }

  async setRoles(estimateId: string, roleTypeIds: string[]): Promise<void> {
    await this.db.$transaction([
      this.db.estimateRoleSelection.deleteMany({ where: { estimateId } }),
      this.db.estimateRoleSelection.createMany({
        data: roleTypeIds.map((roleTypeId) => ({ estimateId, roleTypeId })),
      }),
    ]);
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Record<string, unknown>).code === 'P2002'
  );
}
