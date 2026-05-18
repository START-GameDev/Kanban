'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { projectsService } from '@/features/projects/services/projects.service';
import { Project } from '@/features/projects/schemas/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FolderKanban, Loader2 } from 'lucide-react';

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = projectsService.subscribeToUserProjects(user.uid, (data) => {
      setProjects(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProjectName.trim();
    
    if (!name) {
      alert("Por favor, digite um nome para o projeto.");
      return;
    }

    if (!user) return;
    
    setIsCreating(true);
    try {
      await projectsService.createProject(user.uid, { name });
      setNewProjectName('');
    } catch (err: any) {
      console.error(err);
      alert("Erro ao criar projeto: " + (err.message || "Erro desconhecido"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 overflow-y-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Seus Projetos</h2>
          <p className="text-sm text-slate-500">Crie ou acesse projetos para gerenciar suas tarefas.</p>
        </div>
        
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input 
            placeholder="Nome do projeto..." 
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            disabled={isCreating}
            className="w-full sm:w-64 border-slate-200 focus-visible:ring-indigo-500 rounded-lg placeholder:text-slate-400 bg-white"
          />
          <Button 
            type="submit" 
            disabled={isCreating} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all active:scale-95 disabled:opacity-70"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Criar
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <FolderKanban className="mx-auto mb-4 h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900">Nenhum projeto encontrado</h3>
          <p className="mt-1 text-sm text-slate-500">Você ainda não faz parte de nenhum projeto.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="group flex flex-col items-start justify-between rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-indigo-200 hover:ring-1 hover:ring-indigo-500/20 hover:shadow-md"
            >
              <div>
                <FolderKanban className="mb-4 h-6 w-6 text-slate-400 transition-colors group-hover:text-indigo-600" />
                <h3 className="font-semibold text-slate-900 line-clamp-1">{project.name}</h3>
              </div>
              <span className="mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-indigo-600">
                Acessar quadro &rarr;
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
