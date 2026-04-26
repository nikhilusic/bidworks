export type DbClient = { connected: boolean };

export const createDbClient = (): DbClient => ({ connected: true });
