import { Estimate, EstimateRoleSelection, SolutionPhase } from '@prisma/client';

export type EstimateWithRelations = Estimate & {
  roleSelections: EstimateRoleSelection[];
  solutionPhases: (SolutionPhase & {
    modules: (import('@prisma/client').Module & {
      tasks: (import('@prisma/client').Task & {
        effortEntries: import('@prisma/client').TaskEffortEntry[];
      })[];
    })[];
  })[];
};

export interface EstimateRepository {
  findById(estimateId: string): Promise<EstimateWithRelations | null>;
  findByProjectAndName(projectId: string, name: string): Promise<Estimate | null>;
  create(data: {
    projectId: string;
    name: string;
    description: string;
    startPeriod?: string;
    durationMonths?: number;
    createdBy: string;
    updatedBy: string;
  }): Promise<EstimateWithRelations>;
  update(
    estimateId: string,
    data: {
      name?: string;
      description?: string;
      startPeriod?: string;
      durationMonths?: number;
      updatedBy: string;
      revision: number;
      totalEffortHours?: import('decimal.js').Decimal;
      totalCostEur?: import('decimal.js').Decimal;
    },
  ): Promise<EstimateWithRelations>;
  setRoles(estimateId: string, roleTypeIds: string[]): Promise<void>;
}
