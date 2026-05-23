import { z } from 'zod';

export const columnSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
});

export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assigneeIds: z.array(z.string()).optional(),
  completed: z.boolean().default(false)
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  columnId: z.string(),
  order: z.number(),
  assigneeId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.date().nullable().optional(),
  targetColumnId: z.string().nullable().optional(),
  priority: z.string().optional().nullable(),
  createdAt: z.date(),
  subtasks: z.array(subtaskSchema).optional(),
});

export type Subtask = z.infer<typeof subtaskSchema>;
export type Column = z.infer<typeof columnSchema>;
export type Task = z.infer<typeof taskSchema>;
