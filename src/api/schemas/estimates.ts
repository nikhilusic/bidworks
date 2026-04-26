import { z } from 'zod';

export const StartPeriodSchema = z.string().regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/, {
  message: 'startPeriod must be in YYYY-MM format',
});

export const CreateEstimateSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  startPeriod: StartPeriodSchema.optional(),
  durationMonths: z.number().int().min(1).optional(),
  createdBy: z.string().min(1),
});

export const UpdateEstimateSchema = z.object({
  revision: z.number().int().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startPeriod: StartPeriodSchema.optional(),
  durationMonths: z.number().int().min(1).optional(),
  updatedBy: z.string().min(1),
});

export const SetRolesSchema = z.object({
  roleTypeIds: z.array(z.string().uuid()).min(1),
  revision: z.number().int().min(1),
  updatedBy: z.string().min(1),
});

export const TaskEffortEntryInputSchema = z.object({
  roleTypeId: z.string().uuid(),
  effortHours: z.number().min(0),
});

export const CreateTaskSchema = z.object({
  revision: z.number().int().min(1),
  solutionPhase: z.string().min(1),
  module: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  repetitionCount: z.number().int().min(1),
  effortEntries: z.array(TaskEffortEntryInputSchema),
  updatedBy: z.string().min(1),
});

export const UpdateTaskSchema = z.object({
  revision: z.number().int().min(1),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  repetitionCount: z.number().int().min(1).optional(),
  isEnabled: z.boolean().optional(),
  effortEntries: z.array(TaskEffortEntryInputSchema).optional(),
  updatedBy: z.string().min(1),
});

export type CreateEstimateInput = z.infer<typeof CreateEstimateSchema>;
export type UpdateEstimateInput = z.infer<typeof UpdateEstimateSchema>;
export type SetRolesInput = z.infer<typeof SetRolesSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskEffortEntryInput = z.infer<typeof TaskEffortEntryInputSchema>;
