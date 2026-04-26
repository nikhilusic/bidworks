import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const projectRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Placeholder route for project scope verification
  fastify.get('/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = await fastify.db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: `Project ${projectId} not found` });
    }
    return reply.send({ id: project.id, name: project.name });
  });
};
