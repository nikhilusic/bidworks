export class DomainError extends Error {
  public readonly statusCode: number = 422;

  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Array<{ field: string; issue: string }>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ConflictError extends DomainError {
  public readonly statusCode: number = 409;

  constructor(code: string, message: string, details?: Array<{ field: string; issue: string }>) {
    super(message, code, details);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends DomainError {
  public readonly statusCode: number = 404;

  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
