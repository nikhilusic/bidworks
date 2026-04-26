import { EstimateRepository, EstimateWithRelations } from '../../domain/services/EstimateRepository.js';
import { NotFoundError } from '../../../../shared/errors/domain-error.js';

export class GetEstimateById {
  constructor(private readonly estimateRepo: EstimateRepository) {}

  async execute(estimateId: string, projectId: string): Promise<EstimateWithRelations> {
    const estimate = await this.estimateRepo.findById(estimateId);
    if (!estimate || estimate.projectId !== projectId) {
      throw new NotFoundError('Estimate', estimateId);
    }
    return estimate;
  }
}
