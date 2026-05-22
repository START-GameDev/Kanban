'use client';

import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { projectsService } from '@/features/projects/services/projects.service';
import { Project } from '@/features/projects/schemas/project';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Search, Users, FolderKanban, Layers, ShieldAlert, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const { styles, theme } = useTheme();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    let isSubscribed = true;
    const unsubscribe = projectsService.subscribeToUserProjects(
      user.uid,
      (data) => {
        if (isSubscribed) {
          setProjects(data);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Erro ao assinar projetos:", error);
        if (isSubscribed) {
          setLoading(false);
        }
      }
    );
    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name || isCreating || !user) return;
    
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

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ownedCount = projects.filter(p => p.ownerId === user?.uid).length;
  const colabCount = projects.length - ownedCount;

  return (
    <div className={`w-full h-full overflow-y-auto duration-200 transition-colors ${styles.bgClass} ${styles.textMainClass} relative font-sans`}>
      <div className="mx-auto w-full max-w-6xl px-6 py-10 flex flex-col gap-8">
        
        {/* Sleek Minimal Header Panel */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b ${styles.borderClass}`}>
          <div className="flex flex-col gap-1">
            <h2 className={`text-xl font-bold tracking-tight uppercase font-mono ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              Projetos Ativos
            </h2>
            <p className={`text-xs ${styles.textMutedClass}`}>
              Monitore, instancie e administre as colunas e fluxos de trabalho do seu squad.
            </p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input 
              placeholder="Buscar pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-9 pr-4 py-1.5 w-full sm:w-64 border rounded-md outline-none transition-all text-xs ${styles.inputBgClass} ${styles.inputBorderClass}`}
            />
          </div>
        </div>

        {/* Modular Metrics telemetry row, inspired by Supabase Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-md border flex items-center justify-between ${theme === 'light' ? 'bg-zinc-100/50' : 'bg-black/10'} ${styles.borderClass}`}>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${styles.textMutedClass}`}>Total de Quadros</span>
              <span className={`text-lg font-bold tracking-tight mt-0.5 block ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>{loading ? '...' : projects.length}</span>
            </div>
            <FolderKanban className={`w-4 h-4 opacity-50 ${styles.accentColorClass}`} />
          </div>

          <div className={`p-4 rounded-md border flex items-center justify-between ${theme === 'light' ? 'bg-zinc-100/50' : 'bg-black/10'} ${styles.borderClass}`}>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${styles.textMutedClass}`}>Administrados</span>
              <span className={`text-lg font-bold tracking-tight mt-0.5 block ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>{loading ? '...' : ownedCount}</span>
            </div>
            <Layers className={`w-4 h-4 opacity-50 ${styles.accentColorClass}`} />
          </div>

          <div className={`p-4 rounded-md border flex items-center justify-between ${theme === 'light' ? 'bg-zinc-100/50' : 'bg-black/10'} ${styles.borderClass}`}>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${styles.textMutedClass}`}>Colaborativos</span>
              <span className={`text-lg font-bold tracking-tight mt-0.5 block ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>{loading ? '...' : colabCount}</span>
            </div>
            <Users className={`w-4 h-4 opacity-50 ${styles.accentColorClass}`} />
          </div>

          <div className={`p-4 rounded-md border flex items-center justify-between ${theme === 'light' ? 'bg-zinc-100/50' : 'bg-black/10'} ${styles.borderClass}`}>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${styles.textMutedClass}`}>Status Geral</span>
              <span className="text-xs font-semibold text-emerald-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Operando OK
              </span>
            </div>
            <span className={`text-[9px] font-mono ${styles.kbdOrBadgeClass}`}>200 ms</span>
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
          </div>
        ) : filteredProjects.length === 0 && searchTerm ? (
          <div className={`flex flex-col items-center justify-center rounded-lg border py-16 text-center ${styles.borderClass} ${styles.cardBgClass}`}>
            <ShieldAlert className="mb-3 h-8 w-8 text-zinc-650" />
            <span className="text-xs font-semibold uppercase tracking-wider">Sem correspondências</span>
            <p className={`mt-1.5 text-xs max-w-sm ${styles.textMutedClass}`}>Nenhum projeto encontrado para o termo de pesquisa &ldquo;{searchTerm}&rdquo;.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Inline Project Builder Card */}
            <form 
              onSubmit={handleCreate} 
              className={`border border-dashed p-5 rounded-lg transition-all flex flex-col justify-between min-h-[160px] cursor-pointer w-full ${
                theme === 'light' ? 'hover:bg-zinc-100 bg-zinc-50/20' : 'hover:bg-black/30'
              } ${styles.borderClass}`}
            >
              <div className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className={`w-4 h-4 ${styles.accentColorClass}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                    theme === 'light' ? 'text-zinc-800' : 'text-zinc-300'
                  }`}>Criar Novo Quadro</span>
                </div>
                <input
                  required
                  placeholder="Nome do projeto..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  disabled={isCreating}
                  className={`w-full text-xs px-3 py-1.5 rounded-md border outline-none placeholder:text-zinc-400 transition-all ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
                />
              </div>
              <div className="flex items-center justify-end w-full mt-4">
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={isCreating || !newProjectName.trim()} 
                  className={`h-7 px-3.5 text-[10px] rounded-md transition-all font-semibold uppercase tracking-wider ${styles.btnPrimaryClass}`}
                >
                  {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Instanciar'}
                </Button>
              </div>
            </form>

            {/* Rendered Projects Map */}
            {filteredProjects.map((project) => {
              const userIsOwner = project.ownerId === user?.uid;
              const initials = project.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className={`flex flex-col justify-between rounded-lg border p-5 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer min-h-[160px] group ${styles.cardBgClass} ${styles.borderClass} hover:border-zinc-500/30`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs font-mono border ${styles.accentBgClass} ${styles.accentBorderClass} ${styles.accentColorClass}`}>
                      {initials}
                    </div>
                    <span className={`text-[8px] uppercase font-mono px-2 py-0.5 rounded border ${
                      userIsOwner 
                        ? (theme === 'light' ? 'bg-zinc-100 text-zinc-800 border-zinc-200' : 'bg-zinc-950 text-zinc-300 border-zinc-850')
                        : 'bg-emerald-950/20 text-[#10b981] border-[#10b981]/15'
                    }`}>
                      {userIsOwner ? 'Proprietário' : 'Colaborador'}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className={`font-semibold text-sm tracking-tight group-hover:opacity-80 transition-all ${
                      theme === 'light' ? 'text-zinc-900 font-bold' : 'text-white'
                    }`}>
                      {project.name}
                    </h3>
                    <div className={`flex items-center gap-1 mt-1 text-[10px] ${styles.textMutedClass}`}>
                      <Users className="w-3 h-3 opacity-60 mr-0.5" />
                      <span>{project.memberIds?.length || 1} {project.memberIds?.length === 1 ? 'membro' : 'membros'}</span>
                    </div>
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-mono uppercase tracking-wider transition-all ${styles.borderClass} ${styles.accentColorClass}`}>
                    <span className="opacity-80 group-hover:opacity-100">Abrir Documento</span>
                    <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 duration-150 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
