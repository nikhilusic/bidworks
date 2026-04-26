import { ConflictError } from '../../../../shared/errors/domain-error.js';

export class RevisionGuard {
  check(currentRevision: number, expectedRevision: number): void {
    if (currentRevision !== expectedRevision) {
      throw new ConflictError(
        'REVISION_CONFLICT',
        `Expected revision ${expectedRevision} but current revision is ${currentRevision}. Fetch the latest and retry.`,
      );
    }
  }
}
