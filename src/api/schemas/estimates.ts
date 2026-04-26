import { z } from 'zod';

export const StartPeriodSchema = z.string().regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/, {
  message: 'startPeriod must be in YYYY-MM format',
});

export const CreateEstimateSchema = z.object({
  name: z.string().min(1, 'Estimate name is required'),
  description: z.string().default(''),
  startPeriod: StartPeriodSchema.optional(),
  durationMonths: z.number().int().min(1).optional(),
  createdBy: z.string().default('system'),
});

export const UpdateEstimateSchema = z.object({
  revision: z.number().int().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startPeriod: StartPeriodSchema.optional(),
  durationMonths: z.number().int().min(1).optional(),
  updatedBy: z.string().default('system'),
});

export const SetRolesSchema = z.object({
  selectedRoleTypeIds: z.array(z.string()).min(1, 'At least one role must be selected'),
  revision: z.number().int().min(1),
  updatedBy: z.string().default('system'),
});

export const TaskEffortEntryInputSchema = z.object({
  roleTypeId: z.string().uuid(),
  effortHours: z.number().min(0),
});

export const CreateTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  phaseName: z.string().min(1, 'Phase name is required'),
  moduleName: z.string().min(1, 'Module name is required'),
  roleBudget: z.record(z.string(), z.number().min(0)),
  repetitionCount: z.number().int().min(1).default(1),
  isEnabled: z.boolean().default(true),
  revision: z.number().int().min(1).optional(),
  updatedBy: z.string().default('system'),
});

export const UpdateTaskSchema = z.object({
  revision: z.number().int().min(1),
  name: z.string().min(1).optional(),
  roleBudget: z.record(z.string(), z.number().min(0)).optional(),
  repetitionCount: z.number().int().min(1).optional(),
  isEnabled: z.boolean().optional(),
  updatedBy: z.string().default('system'),
});

export type CreateEstimateInput = z.infer<typeof CreateEstimateSchema>;
export type UpdateEstimateInput = z.infer<typeof UpdateEstimateSchema>;
export type SetRolesInput = z.infer<typeof SetRolesSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskEffortEntryInput = z.infer<typeof TaskEffortEntryInputSchema>;
