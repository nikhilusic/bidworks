import { DomainError } from '../../../../shared/errors/domain-error.js';
import { EstimateRepository } from '../../domain/services/EstimateRepository.js';

export class RoleSelectionGuard {
  constructor(private readonly estimateRepo: EstimateRepository) {}

  async assertRolesSelected(estimateId: string, roleTypeIds: string[]): Promise<void> {
    const estimate = await this.estimateRepo.findById(estimateId);
    if (!estimate) {
      return;
    }

    const selectedRoleIds = new Set(estimate.roleSelections.map((r) => r.roleTypeId));
    const unselectedRoles = roleTypeIds.filter((id) => !selectedRoleIds.has(id));

    if (unselectedRoles.length > 0) {
      throw new DomainError(
        'ROLE_NOT_SELECTED',
        `Role(s) not selected for this estimate: ${unselectedRoles.join(', ')}`,
        422,
        unselectedRoles.map((id) => ({ field: 'effortEntries', issue: `role ${id} not in estimate role selection` })),
      );
    }
  }
}
