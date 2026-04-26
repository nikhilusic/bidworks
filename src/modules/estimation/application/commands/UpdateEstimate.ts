import { EstimateRepository, EstimateWithRelations } from '../../domain/services/EstimateRepository.js';
import { EstimateNamingPolicy } from '../../domain/services/EstimateNamingPolicy.js';
import { NotFoundError } from '../../../../shared/errors/domain-error.js';

export interface UpdateEstimateCommand {
  estimateId: string;
  projectId: string;
  revision: number;
  name?: string;
  description?: string;
  startPeriod?: string;
  durationMonths?: number;
  updatedBy: string;
}

export class UpdateEstimate {
  constructor(
    private readonly estimateRepo: EstimateRepository,
    private readonly namingPolicy: EstimateNamingPolicy,
  ) {}

  async execute(command: UpdateEstimateCommand): Promise<EstimateWithRelations> {
    const existing = await this.estimateRepo.findById(command.estimateId);
    if (!existing) {
      throw new NotFoundError('Estimate', command.estimateId);
    }

    if (command.name && command.name !== existing.name) {
      await this.namingPolicy.assertUnique(command.projectId, command.name, command.estimateId);
    }

    return this.estimateRepo.update(command.estimateId, {
      name: command.name,
      description: command.description,
      startPeriod: command.startPeriod,
      durationMonths: command.durationMonths,
      updatedBy: command.updatedBy,
      revision: command.revision,
    });
  }
}
