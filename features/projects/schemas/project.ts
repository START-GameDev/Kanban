import { z } from 'zod';

export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome do projeto é obrigatório').max(100, 'Nome muito longo'),
  ownerId: z.string().optional(), // Injetado no serviço
  createdAt: z.date().optional(), // Injetado no serviço
});

export type ProjectInput = z.infer<typeof projectSchema>;

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  memberIds?: string[];
}
