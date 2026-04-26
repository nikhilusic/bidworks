import { EstimateRepository, EstimateWithRelations } from '../../domain/services/EstimateRepository.js';
import { NotFoundError } from '../../../../shared/errors/domain-error.js';
import { RevisionGuard } from './RevisionGuard.js';

export interface SetEstimateRolesCommand {
  estimateId: string;
  roleTypeIds: string[];
  revision: number;
  updatedBy: string;
}

export class SetEstimateRoles {
  constructor(
    private readonly estimateRepo: EstimateRepository,
    private readonly revisionGuard: RevisionGuard,
  ) {}

  async execute(command: SetEstimateRolesCommand): Promise<EstimateWithRelations> {
    const existing = await this.estimateRepo.findById(command.estimateId);
    if (!existing) {
      throw new NotFoundError('Estimate', command.estimateId);
    }

    this.revisionGuard.check(existing.revision, command.revision);

    await this.estimateRepo.setRoles(command.estimateId, command.roleTypeIds);

    return this.estimateRepo.update(command.estimateId, {
      updatedBy: command.updatedBy,
      revision: command.revision,
    });
  }
}
