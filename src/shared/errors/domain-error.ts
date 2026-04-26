export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Array<{ field: string; issue: string }>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
