import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import {
  CreateEstimateSchema,
  UpdateEstimateSchema,
  SetRolesSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
} from '../schemas/estimates.js';
import { PrismaEstimateRepository } from '../../modules/estimation/infrastructure/persistence/PrismaEstimateRepository.js';
import { PrismaTaskRepository } from '../../modules/estimation/infrastructure/persistence/PrismaTaskRepository.js';
import { PriceCardProvider } from '../../modules/estimation/infrastructure/pricing/PriceCardProvider.js';
import { EstimateNamingPolicy } from '../../modules/estimation/domain/services/EstimateNamingPolicy.js';
import { RoleSelectionGuard } from '../../modules/estimation/domain/services/RoleSelectionGuard.js';
import { RevisionGuard } from '../../modules/estimation/application/commands/RevisionGuard.js';
import { CreateEstimate } from '../../modules/estimation/application/commands/CreateEstimate.js';
import { UpdateEstimate } from '../../modules/estimation/application/commands/UpdateEstimate.js';
import { SetEstimateRoles } from '../../modules/estimation/application/commands/SetEstimateRoles.js';
import { CreateTask } from '../../modules/estimation/application/commands/CreateTask.js';
import { UpdateTask } from '../../modules/estimation/application/commands/UpdateTask.js';
import { GetEstimateById } from '../../modules/estimation/application/queries/GetEstimateById.js';
import { GetEstimateSummary } from '../../modules/estimation/application/queries/GetEstimateSummary.js';
import { mapEstimateToResponse } from '../../modules/estimation/domain/entities/Estimate.js';
import { DomainError } from '../../shared/errors/domain-error.js';

export const estimateRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /projects/:projectId/estimates
  fastify.post('/:projectId/estimates', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    try {
      const input = CreateEstimateSchema.parse(request.body);
      const repo = new PrismaEstimateRepository(fastify.db);
      const namingPolicy = new EstimateNamingPolicy(repo);
      const command = new CreateEstimate(repo, namingPolicy);
      const estimate = await command.execute({ projectId, ...input });
      return reply.status(201).send(mapEstimateToResponse(estimate));
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // PATCH /projects/:projectId/estimates/:estimateId
  fastify.patch('/:projectId/estimates/:estimateId', async (request, reply) => {
    const { projectId, estimateId } = request.params as { projectId: string; estimateId: string };
    try {
      const input = UpdateEstimateSchema.parse(request.body);
      const repo = new PrismaEstimateRepository(fastify.db);
      const namingPolicy = new EstimateNamingPolicy(repo);
      const command = new UpdateEstimate(repo, namingPolicy);
      const estimate = await command.execute({ estimateId, projectId, ...input });
      return reply.send(mapEstimateToResponse(estimate));
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // PUT /projects/:projectId/estimates/:estimateId/roles
  fastify.put('/:projectId/estimates/:estimateId/roles', async (request, reply) => {
    const { estimateId } = request.params as { projectId: string; estimateId: string };
    try {
      const input = SetRolesSchema.parse(request.body);
      const repo = new PrismaEstimateRepository(fastify.db);
      const revisionGuard = new RevisionGuard();
      const command = new SetEstimateRoles(repo, revisionGuard);
      const estimate = await command.execute({ estimateId, ...input });
      return reply.send(mapEstimateToResponse(estimate));
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // POST /projects/:projectId/estimates/:estimateId/tasks
  fastify.post('/:projectId/estimates/:estimateId/tasks', async (request, reply) => {
    const { estimateId } = request.params as { projectId: string; estimateId: string };
    try {
      const input = CreateTaskSchema.parse(request.body);
      const repo = new PrismaEstimateRepository(fastify.db);
      const roleGuard = new RoleSelectionGuard(repo);
      const priceCard = new PriceCardProvider(fastify.db);
      const revisionGuard = new RevisionGuard();
      const command = new CreateTask(fastify.db, repo, roleGuard, priceCard, revisionGuard);
      
      // Convert roleBudget to effortEntries
      const effortEntries = Object.entries(input.roleBudget).map(([roleTypeId, effortHours]) => ({
        roleTypeId,
        effortHours,
      }));
      
      const updatedEstimate = await command.execute({
        estimateId,
        revision: input.revision || 1,
        solutionPhaseName: input.phaseName,
        moduleName: input.moduleName,
        title: input.name,
        description: '',
        repetitionCount: input.repetitionCount,
        effortEntries,
        updatedBy: input.updatedBy,
      });

      // Find the newly created task to return
      const createdTask = (updatedEstimate.solutionPhases as any[])
        .flatMap((p: any) => (p.modules as any[]).flatMap((m: any) => (m.tasks as any[]).map((t: any) => ({ task: t, phase: p.name, module: m.name }))))
        .find((t: any) => t.task.title === input.name);

      if (!createdTask) {
        return reply.status(201).send({ id: 'unknown', name: input.name, isEnabled: input.isEnabled, repetitionCount: input.repetitionCount, totalEffortHours: 0, totalCostEur: 0 });
      }

      return reply.status(201).send({
        id: createdTask.task.id,
        solutionPhase: createdTask.phase,
        module: createdTask.module,
        name: createdTask.task.title,
        isEnabled: createdTask.task.isEnabled,
        repetitionCount: createdTask.task.repetitionCount,
        totalEffortHours: parseFloat(createdTask.task.totalEffortHours.toString()),
        totalCostEur: parseFloat(createdTask.task.totalCostEur.toString()),
      });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // PATCH /projects/:projectId/estimates/:estimateId/tasks/:taskId
  fastify.patch('/:projectId/estimates/:estimateId/tasks/:taskId', async (request, reply) => {
    const { estimateId, taskId } = request.params as { projectId: string; estimateId: string; taskId: string };
    try {
      const input = UpdateTaskSchema.parse(request.body);
      const repo = new PrismaEstimateRepository(fastify.db);
      const roleGuard = new RoleSelectionGuard(repo);
      const priceCard = new PriceCardProvider(fastify.db);
      const revisionGuard = new RevisionGuard();
      const command = new UpdateTask(fastify.db, repo, roleGuard, priceCard, revisionGuard);
      const { task } = await command.execute({
        estimateId,
        taskId,
        ...input,
      });

      // Resolve phase/module names for response
      const module = await fastify.db.module.findUnique({
        where: { id: task.moduleId },
        include: { solutionPhase: true },
      });

      return reply.send({
        id: task.id,
        solutionPhase: module?.solutionPhase.name,
        module: module?.name,
        title: task.title,
        description: task.description,
        isEnabled: task.isEnabled,
        repetitionCount: task.repetitionCount,
        totalEffortHours: parseFloat(task.totalEffortHours.toString()),
        totalCostEur: parseFloat(task.totalCostEur.toString()),
      });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /projects/:projectId/estimates/:estimateId/summary
  fastify.get('/:projectId/estimates/:estimateId/summary', async (request, reply) => {
    const { projectId, estimateId } = request.params as { projectId: string; estimateId: string };
    try {
      const query = new GetEstimateSummary(fastify.db);
      const summary = await query.execute(estimateId, projectId);
      return reply.send(summary);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /projects/:projectId/estimates/:estimateId
  fastify.get('/:projectId/estimates/:estimateId', async (request, reply) => {
    const { projectId, estimateId } = request.params as { projectId: string; estimateId: string };
    try {
      const repo = new PrismaEstimateRepository(fastify.db);
      const query = new GetEstimateById(repo);
      const estimate = await query.execute(estimateId, projectId);
      return reply.send(mapEstimateToResponse(estimate));
    } catch (err) {
      return handleError(err, reply);
    }
  });
};

function handleError(err: unknown, reply: import('fastify').FastifyReply): import('fastify').FastifyReply {
  if (err instanceof DomainError) {
    void reply.status(err.statusCode).send({
      code: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
    return reply;
  }
  if (err instanceof ZodError) {
    void reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.errors.map((e) => ({ field: e.path.join('.'), issue: e.message })),
    });
    return reply;
  }
  throw err;
}
