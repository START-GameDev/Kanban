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

  useEffect(() => {
    // Load project details
    getDoc(doc(db, 'projects', projectId)).then(snap => {
      if(snap.exists()) setProjectName(snap.data().name);
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

  const handleCreateColumn = async () => {
    const name = prompt("Nome da coluna:");
    if (name) {
      const order = useKanbanStore.getState().columns.length * 1000;
      await kanbanService.addColumn(projectId, name, order);
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
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{projectName}</h1>
          <p className="text-sm text-slate-500">Gestão do Projeto</p>
        </div>
        <div className="flex space-x-2">
          <form onSubmit={handleInvite} className="flex gap-2 mr-2">
            <input 
              type="email" 
              value={inviteEmail} 
              onChange={e => setInviteEmail(e.target.value)} 
              placeholder="Email do usuário..." 
              required
              className="px-3 py-1 text-sm border border-slate-200 rounded-md focus-visible:ring-indigo-500 focus-visible:outline-none"
            />
            <button type="submit" disabled={isInviting} className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Convidar</span>
            </button>
          </form>
          <button onClick={handleCreateColumn} className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nova Coluna</span>
          </button>
        </div>
      </div>
      <div className="flex-grow flex px-6 space-x-4 pb-6 overflow-hidden">
        <Board projectId={projectId} />
      </div>
    </div>
  );
}
