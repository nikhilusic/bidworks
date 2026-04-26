import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

let prismaClient: PrismaClient;

export const dbPlugin = fastifyPlugin(
  async (fastify: FastifyInstance) => {
    if (!prismaClient) {
      prismaClient = new PrismaClient();
    }
    fastify.decorate('db', prismaClient);
  },
  { name: 'db-plugin' }
);

export type DbClient = PrismaClient;
