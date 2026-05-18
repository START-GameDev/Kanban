'use client';

import { useEffect, useState, use } from 'react';
import { useKanbanStore } from '@/features/kanban/store/kanban.store';
import { kanbanService } from '@/features/kanban/services/kanban.service';
import { Board } from '@/features/kanban/components/board';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Plus, Users, Loader2 } from 'lucide-react';

export default function ProjectKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const setColumns = useKanbanStore(s => s.setColumns);
  const setTasks = useKanbanStore(s => s.setTasks);
  
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  useEffect(() => {
    // Load project details
    getDoc(doc(db, 'projects', projectId)).then(snap => {
      if(snap.exists()) setProjectName(snap.data().name);
    });

    kanbanService.getProjectMembers(projectId).then(members => {
      setProjectMembers(members);
    });

    const unsubCols = kanbanService.subscribeToColumns(projectId, (cols) => {
      setColumns(cols);
    });
    const unsubTasks = kanbanService.subscribeToTasks(projectId, (tasks) => {
      setTasks(tasks);
      setLoading(false);
    });

    return () => {
      unsubCols();
      unsubTasks();
    };
  }, [projectId, setColumns, setTasks]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!inviteEmail) return;
    setIsInviting(true);
    try {
      await kanbanService.inviteUserByEmail(projectId, inviteEmail);
      alert("Usuário convidado!");
      setInviteEmail('');
    } catch(err: any) {
      alert(err.message || 'Erro ao convidar.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    try {
      const currentColumns = useKanbanStore.getState().columns;
      const order = currentColumns.length * 1000;
      
      await kanbanService.addColumn(projectId, newColumnName.trim(), order);
      setNewColumnName('');
      setIsAddingColumn(false);
    } catch (error: any) {
      console.error("Erro ao criar coluna:", error);
      alert("Erro ao criar coluna: " + (error.message || "Erro desconhecido"));
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden">
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 border-b border-slate-200 bg-white shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{projectName}</h1>
          <p className="text-sm text-slate-500">Quadro Kanban • Visualização em tempo real</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleInvite} className="flex gap-2">
            <input 
              type="email" 
              value={inviteEmail} 
              onChange={e => setInviteEmail(e.target.value)} 
              placeholder="Email do usuário..." 
              required
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none w-48"
            />
            <button type="submit" disabled={isInviting} className="p-2 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors">
              <Users className="w-5 h-5" />
              <span className="hidden lg:inline text-sm font-medium">Convidar</span>
            </button>
          </form>

          <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

          {isAddingColumn ? (
            <form onSubmit={handleCreateColumn} className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <input 
                autoFocus
                type="text" 
                value={newColumnName} 
                onChange={e => setNewColumnName(e.target.value)} 
                placeholder="Nome da coluna..." 
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none w-40"
              />
              <button type="submit" className="px-3 h-9 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 active:scale-95 transition-all">
                Salvar
              </button>
              <button 
                type="button" 
                onClick={() => setIsAddingColumn(false)}
                className="px-3 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingColumn(true)} 
              className="p-2 h-9 rounded-lg border border-slate-200 bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Nova Coluna</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-grow flex px-6 space-x-4 py-6 overflow-hidden">
        <Board projectId={projectId} members={projectMembers} />
      </div>
    </div>
  );
}
