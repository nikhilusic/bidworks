import { ConflictError } from '../../../../shared/errors/domain-error.js';
import { EstimateRepository } from '../services/EstimateRepository.js';

export class EstimateNamingPolicy {
  constructor(private readonly estimateRepo: EstimateRepository) {}

  async assertUnique(projectId: string, name: string, excludeEstimateId?: string): Promise<void> {
    const existing = await this.estimateRepo.findByProjectAndName(projectId, name);
    if (existing && existing.id !== excludeEstimateId) {
      throw new ConflictError(
        'DUPLICATE_ESTIMATE_NAME',
        `An estimate named '${name}' already exists in this project`,
      );
    }
  }
}
