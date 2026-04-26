import type { FastifyPluginAsync } from 'fastify';

export const projectRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return reply.send({ status: 'ok' });
  });
};
