import { z } from 'zod';

export const columnSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  columnId: z.string(),
  order: z.number(),
  assigneeId: z.string().optional(),
  createdAt: z.date(),
});

export type Column = z.infer<typeof columnSchema>;
export type Task = z.infer<typeof taskSchema>;
