import { Estimate as PrismaEstimate } from '@prisma/client';

export interface EstimateProps {
  id: string;
  projectId: string;
  name: string;
  revision: number;
  description: string;
  status: 'Draft';
  startPeriod: string | null;
  durationMonths: number | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  totalEffortHours: number;
  totalCostEur: number;
}

export function mapEstimateToResponse(estimate: PrismaEstimate): EstimateProps {
  return {
    id: estimate.id,
    projectId: estimate.projectId,
    name: estimate.name,
    revision: estimate.revision,
    description: estimate.description,
    status: 'Draft',
    startPeriod: estimate.startPeriod ?? null,
    durationMonths: estimate.durationMonths ?? null,
    createdAt: estimate.createdAt,
    createdBy: estimate.createdBy,
    updatedAt: estimate.updatedAt,
    updatedBy: estimate.updatedBy,
    totalEffortHours: parseFloat(estimate.totalEffortHours.toString()),
    totalCostEur: parseFloat(estimate.totalCostEur.toString()),
  };
}
