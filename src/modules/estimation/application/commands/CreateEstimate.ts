import { EstimateRepository, EstimateWithRelations } from '../../domain/services/EstimateRepository.js';
import { EstimateNamingPolicy } from '../../domain/services/EstimateNamingPolicy.js';

export interface CreateEstimateCommand {
  projectId: string;
  name: string;
  description: string;
  startPeriod?: string;
  durationMonths?: number;
  createdBy: string;
}

export class CreateEstimate {
  constructor(
    private readonly estimateRepo: EstimateRepository,
    private readonly namingPolicy: EstimateNamingPolicy,
  ) {}

  async execute(command: CreateEstimateCommand): Promise<EstimateWithRelations> {
    await this.namingPolicy.assertUnique(command.projectId, command.name);

    return this.estimateRepo.create({
      projectId: command.projectId,
      name: command.name,
      description: command.description,
      startPeriod: command.startPeriod,
      durationMonths: command.durationMonths,
      createdBy: command.createdBy,
      updatedBy: command.createdBy,
    });
  }
}
