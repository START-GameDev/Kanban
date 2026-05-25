'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useKanbanStore } from '@/features/kanban/store/kanban.store';
import { kanbanService } from '@/features/kanban/services/kanban.service';
import { Board } from '@/features/kanban/components/board';
import { AddTaskModal } from '@/features/kanban/components/add-task-modal';
import { EditTaskModal } from '@/features/kanban/components/edit-task-modal';
import { useTheme } from '@/providers/theme-provider';
import { useAuth } from '@/providers/auth-provider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Loader2, ArrowLeft, Users, Plus, X, Shield, Check, Trash2, Search, Pencil, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSearchableSelect } from '@/components/ui/multi-searchable-select';

const colors = [
  'bg-emerald-500/15 text-emerald-600 border-emerald-550/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  'bg-rose-500/15 text-rose-600 border-rose-550/25 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  'bg-sky-500/15 text-sky-600 border-sky-550/25 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  'bg-amber-500/15 text-amber-600 border-amber-550/25 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  'bg-violet-500/15 text-violet-600 border-violet-550/25 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
  'bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-550/25 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/20',
  'bg-teal-500/15 text-teal-600 border-teal-550/25 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
  'bg-orange-500/15 text-orange-600 border-orange-550/25 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
];

const getAvatarColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < (userId || '').length; i++) {
    hash = (userId || '').charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function ProjectKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const setColumns = useKanbanStore(s => s.setColumns);
  const setTasks = useKanbanStore(s => s.setTasks);
  const { styles, theme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  // Members Management States
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'list' | 'add'>('list');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [chosenAddRole, setChosenAddRole] = useState<'admin' | 'collaborator' | 'reader'>('collaborator');
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'column' | 'task';
    targetId: string;
    task?: any;
  } | null>(null);

  // New Task Modal States
  const [addTaskColumnId, setAddTaskColumnId] = useState<string | null>(null);
  const [addFormTitle, setAddFormTitle] = useState('');
  const [addFormDesc, setAddFormDesc] = useState('');
  const [addFormAssigneeIds, setAddFormAssigneeIds] = useState<string[]>([]);
  const [addFormTags, setAddFormTags] = useState<string[]>([]);
  const [addFormTimerType, setAddFormTimerType] = useState<'none' | 'datetime' | 'duration'>('none');
  const [addFormDueDate, setAddFormDueDate] = useState('');
  const [addFormDurationValue, setAddFormDurationValue] = useState<number>(15);
  const [addFormDurationUnit, setAddFormDurationUnit] = useState<'minutes' | 'hours'>('minutes');
  const [addFormTargetColumnId, setAddFormTargetColumnId] = useState('');
  const [addFormPriority, setAddFormPriority] = useState('medium');
  const [isSavingNewTask, setIsSavingNewTask] = useState(false);

  // Edit Task Modal States
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editFormTitle, setEditFormTitle] = useState('');
  const [editFormDesc, setEditFormDesc] = useState('');
  const [editFormAssigneeIds, setEditFormAssigneeIds] = useState<string[]>([]);
  const [editFormTags, setEditFormTags] = useState<string[]>([]);
  const [editFormTimerType, setEditFormTimerType] = useState<'none' | 'datetime' | 'duration'>('none');
  const [editFormDueDate, setEditFormDueDate] = useState('');
  const [editFormDurationValue, setEditFormDurationValue] = useState<number>(15);
  const [editFormDurationUnit, setEditFormDurationUnit] = useState<'minutes' | 'hours'>('minutes');
  const [editFormTargetColumnId, setEditFormTargetColumnId] = useState('');
  const [editFormPriority, setEditFormPriority] = useState('');
  const [isSavingEditTask, setIsSavingEditTask] = useState(false);

  // Custom Deletion Confirmation Modal State
  const [taskToDelete, setTaskToDelete] = useState<any | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Task filter states
  const [filterColumnId, setFilterColumnId] = useState<string>('all');
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>('all');
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterTimer, setFilterTimer] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);

  // Persistent Project Tags State
  const [projectTags, setProjectTags] = useState<string[]>([]);

  // Column Delete custom modal states
  const [columnToDelete, setColumnToDelete] = useState<any | null>(null);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);

  // View Task Modal State
  const [viewingTask, setViewingTask] = useState<any | null>(null);

  // Menu Autoclose Timer Setup
  const menuTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (contextMenu) {
      if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
      menuTimerRef.current = setTimeout(() => {
        setContextMenu(null);
      }, 4000);
    } else {
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
        menuTimerRef.current = null;
      }
    }
    return () => {
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
      }
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;

    getDoc(doc(db, 'projects', projectId))
      .then(snap => {
        if (isSubscribed && snap.exists()) {
          setProjectName(snap.data().name);
        }
      })
      .catch(err => {
        console.error("Erro ao buscar detalhes do projeto:", err);
      });

    kanbanService.getProjectMembers(projectId)
      .then(members => {
        if (isSubscribed) {
          setProjectMembers(members);
        }
      })
      .catch(err => {
        console.error("Erro ao buscar membros do projeto:", err);
      });

    kanbanService.getAllUsers()
      .then(users => {
        if (isSubscribed) {
          setAllUsers(users);
        }
      })
      .catch(err => {
        console.error("Erro ao buscar todos os usuários:", err);
      });

    const unsubCols = kanbanService.subscribeToColumns(
      projectId,
      (cols) => {
        if (isSubscribed) {
          setColumns(cols);
        }
      },
      (error) => {
        console.error("Erro ao assinar colunas do projeto:", error);
      }
    );

    const unsubTasks = kanbanService.subscribeToTasks(
      projectId,
      (tasks) => {
        if (isSubscribed) {
          setTasks(tasks);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Erro ao assinar tarefas do projeto:", error);
        if (isSubscribed) {
          setLoading(false);
        }
      }
    );

    const unsubTags = kanbanService.subscribeToTags(
      projectId,
      (tags) => {
        if (isSubscribed) {
          setProjectTags(tags);
        }
      },
      (error) => {
        console.error("Erro ao assinar tags do projeto:", error);
      }
    );

    return () => {
      isSubscribed = false;
      unsubCols();
      unsubTasks();
      unsubTags();
    };
  }, [projectId, user, authLoading, setColumns, setTasks]);

  const currentUserMember = projectMembers.find(m => m.id === user?.uid);
  const currentUserRole = currentUserMember?.role || 'reader'; // Default to 'reader' if not loaded or not found

  const canEditKanban = currentUserRole !== 'reader';
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

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
      console.error(error);
      alert("Erro ao criar coluna: " + (error.message || "Erro desconhecido"));
    }
  };

  const executeDeleteColumn = async () => {
    if (!columnToDelete) return;
    setIsDeletingColumn(true);
    try {
      await kanbanService.deleteColumn(projectId, columnToDelete.id);
      setColumnToDelete(null);
    } catch (err: any) {
      alert('Erro ao excluir coluna: ' + err.message);
    } finally {
      setIsDeletingColumn(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await kanbanService.changeMemberRole(projectId, targetUserId, newRole);
      setProjectMembers(prev => prev.map(m => m.id === targetUserId ? { ...m, role: newRole } : m));
    } catch (err: any) {
      alert('Erro ao alterar cargo: ' + err.message);
    }
  };

  const executeRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await kanbanService.removeUserFromProject(projectId, memberToRemove.id);
      setProjectMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
      setMemberToRemove(null);
    } catch (err: any) {
      alert('Erro ao excluir membro: ' + err.message);
    }
  };

  const handleBatchAddMembers = async () => {
    if (selectedUserIds.length === 0) return;
    setIsSavingBatch(true);
    try {
      await kanbanService.addMultipleUsersToProject(projectId, selectedUserIds, chosenAddRole);
      const updatedMembers = await kanbanService.getProjectMembers(projectId);
      setProjectMembers(updatedMembers);
      setSelectedUserIds([]);
      setModalStep('list');
    } catch (err: any) {
      alert('Erro ao adicionar membros: ' + err.message);
    } finally {
      setIsSavingBatch(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };



  const handleColumnContextMenu = (e: React.MouseEvent, columnId: string) => {
    if (!canEditKanban) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'column',
      targetId: columnId
    });
  };

  const handleTaskContextMenu = (e: React.MouseEvent, task: any) => {
    if (!canEditKanban) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'task',
      targetId: task.id,
      task: task
    });
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTaskColumnId || !addFormTitle.trim()) return;
    setIsSavingNewTask(true);
    try {
      const relevantTasks = useKanbanStore.getState().tasks.filter(t => t.columnId === addTaskColumnId);
      const order = relevantTasks.length * 1000;

      let finalDueDate: Date | null = null;
      if (addFormTimerType === 'datetime' && addFormDueDate) {
        finalDueDate = new Date(addFormDueDate);
      } else if (addFormTimerType === 'duration' && addFormDurationValue > 0) {
        const multiplier = addFormDurationUnit === 'hours' ? 60 * 60 * 1000 : 60 * 1000;
        finalDueDate = new Date(Date.now() + addFormDurationValue * multiplier);
      }

      await kanbanService.addTask(
        projectId,
        addTaskColumnId,
        addFormTitle.trim(),
        order,
        addFormDesc.trim(),
        addFormAssigneeIds[0] || '',
        addFormPriority,
        addFormAssigneeIds,
        addFormTags,
        finalDueDate,
        addFormTargetColumnId || null
      );

      setAddTaskColumnId(null);
      setAddFormTitle('');
      setAddFormDesc('');
      setAddFormAssigneeIds([]);
      setAddFormTags([]);
      setAddFormTimerType('none');
      setAddFormDueDate('');
      setAddFormDurationValue(15);
      setAddFormDurationUnit('minutes');
      setAddFormTargetColumnId('');
      setAddFormPriority('medium');
    } catch (err: any) {
      alert('Erro ao adicionar tarefa: ' + err.message);
    } finally {
      setIsSavingNewTask(false);
    }
  };

  const handleEditTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editFormTitle.trim()) return;
    setIsSavingEditTask(true);
    try {
      let finalDueDate: Date | null = null;
      if (editFormTimerType === 'datetime' && editFormDueDate) {
        finalDueDate = new Date(editFormDueDate);
      } else if (editFormTimerType === 'duration' && editFormDurationValue > 0) {
        const multiplier = editFormDurationUnit === 'hours' ? 60 * 60 * 1000 : 60 * 1000;
        finalDueDate = new Date(Date.now() + editFormDurationValue * multiplier);
      } else if (editingTask.dueDate && editFormTimerType !== 'none') {
        // preserve existing if they didn't touch it but type is selected
        finalDueDate = new Date(editingTask.dueDate);
      }

      await kanbanService.updateTask(projectId, editingTask.id, {
        title: editFormTitle.trim(),
        description: editFormDesc.trim(),
        assigneeId: editFormAssigneeIds[0] || null,
        assigneeIds: editFormAssigneeIds,
        tags: editFormTags,
        dueDate: finalDueDate,
        targetColumnId: editFormTargetColumnId || null,
        priority: editFormPriority
      });

      setEditingTask(null);
      setEditFormTitle('');
      setEditFormDesc('');
      setEditFormAssigneeIds([]);
      setEditFormTags([]);
      setEditFormTimerType('none');
      setEditFormDueDate('');
      setEditFormDurationValue(15);
      setEditFormDurationUnit('minutes');
      setEditFormTargetColumnId('');
      setEditFormPriority('');
    } catch (err: any) {
      alert('Erro ao editar tarefa: ' + err.message);
    } finally {
      setIsSavingEditTask(false);
    }
  };

  const executeDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await kanbanService.deleteTask(projectId, taskToDelete.id);
      setTaskToDelete(null);
    } catch (err: any) {
      alert('Erro ao excluir tarefa: ' + err.message);
    } finally {
      setIsDeletingTask(false);
    }
  };

  // Searching current and available users
  const filteredCurrentMembers = projectMembers.filter(m => {
    const searchLow = memberSearchTerm.toLowerCase();
    return (m.name || '').toLowerCase().includes(searchLow) || (m.email || '').toLowerCase().includes(searchLow);
  });

  const filteredAvailableUsers = allUsers.filter(u => {
    const isAlreadyIn = projectMembers.some(m => m.id === u.id);
    if (isAlreadyIn) return false;
    const searchLow = addSearchTerm.toLowerCase();
    return (u.name || '').toLowerCase().includes(searchLow) || (u.email || '').toLowerCase().includes(searchLow);
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="text-[9px] font-mono tracking-wider uppercase font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded">Proprietário</span>;
      case 'admin':
        return <span className="text-[9px] font-mono tracking-wider uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded">Administrador</span>;
      case 'collaborator':
        return <span className="text-[9px] font-mono tracking-wider uppercase font-bold text-sky-500 bg-sky-500/10 px-2.5 py-1 rounded">Colaborador</span>;
      case 'reader':
        return <span className="text-[9px] font-mono tracking-wider uppercase font-bold text-zinc-400 bg-zinc-400/10 px-2.5 py-1 rounded">Leitor</span>;
      default:
        return <span className="text-[9px] font-mono tracking-wider uppercase font-bold text-zinc-500 bg-zinc-500/10 px-2.5 py-1  rounded">Membro</span>;
    }
  };

  if (loading) {
    return (
      <div className={`flex h-full w-full items-center justify-center transition-colors duration-200 ${styles.bgClass}`}>
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden relative transition-colors duration-200 ${styles.bgClass}`}>
      {/* Subheader Toolbar */}
      <div className={`px-4 py-3.5 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 border-b relative z-10 transition-colors duration-200 ${styles.headerBgClass} ${styles.headerBorderClass}`}>
        <div className="flex flex-col gap-1">
          <Link href="/projects" className={`inline-flex items-center text-[10px] gap-1 hover:opacity-80 transition-opacity font-mono uppercase tracking-wider mb-1 cursor-pointer ${styles.textMutedClass}`}>
            <ArrowLeft className="w-3 h-3 cursor-pointer" />
            Voltar para projetos
          </Link>
          <div className="flex items-center gap-3">
            <h1 className={`text-base font-bold tracking-tight uppercase font-mono ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{projectName}</h1>
          </div>
        </div>
        
        {/* Collaborators and Column Adders */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Nova Membros trigger */}
          <button 
            onClick={() => {
              setModalStep('list');
              setIsMembersOpen(true);
            }} 
            className={`h-7 px-3.5 rounded-md flex items-center gap-2 transition-all text-[10px] uppercase font-semibold cursor-pointer border ${styles.btnSecondaryClass}`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Membros</span>
          </button>

          {/* Minhas Tasks Quick Filter */}
          {user && (
            <button
              onClick={() => {
                if (filterAssigneeId === user.uid) {
                  setFilterAssigneeId('all');
                } else {
                  setFilterAssigneeId(user.uid);
                }
              }}
              className={`h-7 px-3.5 rounded-md flex items-center gap-1.5 transition-all text-[10px] uppercase font-semibold cursor-pointer border ${
                filterAssigneeId === user.uid
                  ? 'bg-[#10b981]/15 border-[#10b981]/30 text-[#10b981] font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                  : styles.btnSecondaryClass
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Minhas Tasks</span>
            </button>
          )}

          <button
            onClick={() => setIsFilterBarOpen(!isFilterBarOpen)}
            className={`h-7 px-3.5 rounded-md flex items-center gap-2 transition-all text-[10px] uppercase font-semibold cursor-pointer border ${
              isFilterBarOpen 
                ? 'bg-zinc-500/15 border-zinc-500/30 text-zinc-200' 
                : styles.btnSecondaryClass
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar</span>
          </button>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {isFilterBarOpen && (
        <div className={`px-4 py-3 md:px-6 md:py-4 border-b flex flex-wrap gap-4 items-center transition-all duration-200 ${styles.headerBgClass} ${styles.headerBorderClass} animate-in slide-in-from-top-3 duration-150`}>
          <div className="flex items-center gap-2 text-xs font-semibold mr-2 font-mono uppercase tracking-wider text-zinc-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros ativos:</span>
          </div>

          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Coluna</span>
            <SearchableSelect
              options={[
                { value: 'all', label: 'Todas as Colunas' },
                ...useKanbanStore.getState().columns.map(c => ({ value: c.id, label: c.name }))
              ]}
              value={filterColumnId}
              onChange={setFilterColumnId}
              placeholder="Minha Coluna"
              searchPlaceholder="Pesquisar..."
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[180px]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Responsável</span>
            <SearchableSelect
              options={[
                { value: 'all', label: 'Qualquer Pessoa' },
                { value: 'unassigned', label: 'Sem responsável' },
                ...projectMembers.map(m => ({
                  value: m.id,
                  label: m.name || m.email,
                  sublabel: m.email,
                  avatar: m.photoURL ? (
                    <img src={m.photoURL} alt="" className="w-4 h-4 rounded-full" />
                  ) : (
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${getAvatarColor(m.id)}`}>
                      {(m.name ? m.name[0] : m.email[0]).toUpperCase()}
                    </div>
                  )
                }))
              ]}
              value={filterAssigneeId}
              onChange={setFilterAssigneeId}
              placeholder="Pesquisar responsável"
              searchPlaceholder="Membro..."
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Prioridade</span>
            <SearchableSelect
              options={[
                { value: 'all', label: 'Qualquer Prioridade' },
                { value: 'low', label: '🟢 Baixa' },
                { value: 'medium', label: '🟡 Média' },
                { value: 'high', label: '🔴 Alta' }
              ]}
              value={filterPriority}
              onChange={setFilterPriority}
              placeholder="Minha Prioridade"
              searchPlaceholder="Prioridade..."
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Tag</span>
            <SearchableSelect
              options={[
                { value: 'all', label: 'Qualquer Tag' },
                ...projectTags.map(tag => ({ value: tag, label: `#${tag}` }))
              ]}
              value={filterTag}
              onChange={setFilterTag}
              placeholder="Selecionar Tag"
              searchPlaceholder="Tag..."
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Timer</span>
            <SearchableSelect
              options={[
                { value: 'all', label: 'Qualquer Status' },
                { value: 'has-timer', label: '⏱️ Com Timer' },
                { value: 'no-timer', label: '🚫 Sem Timer' },
                { value: 'near', label: '⚠️ Perto do Fim (<15m)' },
                { value: 'expired', label: '🚨 Tempo Expirado' },
                { value: 'completed', label: '🎉 Meta Atingida' },
              ]}
              value={filterTimer}
              onChange={setFilterTimer}
              placeholder="Minhas Datas"
              searchPlaceholder="Timer..."
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Cor do Card</span>
            <SearchableSelect
              options={[
                { value: 'all', label: 'Qualquer Cor' },
                { value: 'default', label: 'Padrão (Neutro)' },
                { value: 'red', label: '🔴 Vermelho' },
                { value: 'blue', label: '🔵 Azul' },
                { value: 'green', label: '🟢 Verde' },
                { value: 'yellow', label: '🟡 Amarelo' },
                { value: 'purple', label: '🟣 Roxo' },
                { value: 'teal', label: '🟢 Teal' },
              ]}
              value={filterColor}
              onChange={setFilterColor}
              placeholder="Cor do Card"
              searchPlaceholder="Filtrar cor..."
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[200px] flex-grow sm:flex-grow-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Buscar por texto</span>
            <input
              type="text"
              placeholder="Pesquisar título/descrição..."
              value={filterSearchTerm}
              onChange={e => setFilterSearchTerm(e.target.value)}
              className={`w-full text-xs px-3.5 py-1.5 h-8.5 rounded-md outline-none transition-all placeholder:text-zinc-500 border ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
            />
          </div>

          {(filterColumnId !== 'all' || filterAssigneeId !== 'all' || filterSearchTerm !== '' || filterPriority !== 'all' || filterTag !== 'all' || filterTimer !== 'all' || filterColor !== 'all') && (
            <button
              onClick={() => {
                setFilterColumnId('all');
                setFilterAssigneeId('all');
                setFilterSearchTerm('');
                setFilterPriority('all');
                setFilterTag('all');
                setFilterTimer('all');
                setFilterColor('all');
              }}
              className="text-[9px] font-semibold tracking-wider font-mono uppercase text-rose-500 hover:text-rose-600 hover:underline cursor-pointer md:mt-4"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}
      
      {/* Board Layout wrapper */}
      <div className="flex-grow flex px-3 py-3 md:px-6 md:py-6 overflow-hidden relative z-10">
        <Board 
          projectId={projectId} 
          members={projectMembers} 
          currentUserRole={currentUserRole} 
          onColumnContextMenu={handleColumnContextMenu}
          onTaskContextMenu={handleTaskContextMenu}
          onDeleteTaskClick={(task) => setTaskToDelete(task)}
          onEditTaskClick={(task) => {
            setEditingTask(task);
            setEditFormTitle(task?.title || '');
            setEditFormDesc(task?.description || '');
            setEditFormAssigneeIds(task?.assigneeIds || (task?.assigneeId ? [task.assigneeId] : []));
            setEditFormTags(task?.tags || []);
            setEditFormTimerType(task?.dueDate ? 'datetime' : 'none');
            try {
              // Convert Timestamp or JS Date safely
              const dateVal = task?.dueDate;
              if (dateVal) {
                const dateObj = (dateVal as any).toDate ? (dateVal as any).toDate() : new Date(dateVal);
                // Adjust to local ISO datetime-local input format
                const tzo = dateObj.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(dateObj.getTime() - tzo)).toISOString().slice(0, 16);
                setEditFormDueDate(localISOTime);
              } else {
                setEditFormDueDate('');
              }
            } catch (e) {
              setEditFormDueDate('');
            }
            setEditFormTargetColumnId(task?.targetColumnId || '');
            setEditFormPriority(task?.priority || 'medium');
          }}
          onDeleteColumnClick={(col) => setColumnToDelete(col)}
          onCardClick={(task) => setViewingTask(task)}
          onAddTaskClick={(colId) => {
            setAddTaskColumnId(colId);
            setAddFormAssigneeIds([]);
            setAddFormTags([]);
            setAddFormTimerType('none');
            setAddFormDueDate('');
            setAddFormTargetColumnId('');
            setAddFormPriority('medium');
          }}
          filterColumnId={filterColumnId}
          filterAssigneeId={filterAssigneeId}
          filterSearchTerm={filterSearchTerm}
          filterPriority={filterPriority}
          filterTag={filterTag}
          filterTimer={filterTimer}
          filterColor={filterColor}
        />
      </div>

      {/* MODAL: MEMBROS DO PROJETO */}
      {isMembersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-xl shadow-xl relative overflow-visible flex flex-col max-h-[85vh] transition-all border ${styles.cardBgClass} ${styles.borderClass}`}>
            
            {/* Modal Header */}
            <div className={`p-5 flex items-center justify-between border-b ${styles.borderClass}`}>
              <div className="flex items-center gap-2">
                <Users className={`w-4 h-4 ${styles.accentColorClass}`} />
                <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
                  {modalStep === 'list' ? 'Membros do Projeto' : 'Adicionar Novos Integrantes'}
                </h3>
              </div>
              <button 
                onClick={() => setIsMembersOpen(false)}
                className={`p-1.5 rounded-lg hover:bg-zinc-500/10 text-zinc-500 hover:text-zinc-150 transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: MEMBER LIST */}
            {modalStep === 'list' && (
              <>
                {/* Search existing members */}
                <div className="p-4 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder="Pesquisar integrantes no projeto..."
                      value={memberSearchTerm}
                      onChange={e => setMemberSearchTerm(e.target.value)}
                      className={`w-full text-xs pl-9 pr-4 py-2 border rounded-md outline-none transition-all ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
                    />
                  </div>
                </div>

                {/* Member List Scroll Area */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                  {filteredCurrentMembers.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Nenhum integrante encontrado</p>
                    </div>
                  ) : (
                    filteredCurrentMembers.map(member => {
                      const isOwner = member.role === 'owner';
                      const isAdmin = member.role === 'admin';
                      const currentIsOwner = currentUserRole === 'owner';
                      const currentIsAdmin = currentUserRole === 'admin';

                      // Determine if the current logged-in user can touch this member's settings
                      // Owner can manage anyone (except themselves - can't set their own role or delete themselves).
                      // Admin can manage collaborator & reader, but cannot edit owners or other admins.
                      const canManageTarget = canManageMembers && 
                        (member.id !== user?.uid) &&
                        (currentIsOwner || (currentIsAdmin && !isOwner && !isAdmin));

                      return (
                        <div 
                          key={member.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            theme === 'light' ? 'bg-zinc-50/50 hover:bg-zinc-50' : 'bg-black/10 hover:bg-black/20'
                          } ${styles.borderClass}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border-2 shrink-0 ${styles.accentBgClass} ${styles.accentBorderClass} ${styles.accentColorClass}`}>
                              {(member.name ? member.name[0] : member.email[0]).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${theme === 'light' ? 'text-zinc-800' : 'text-zinc-150'}`}>
                                {member.name || member.email.split('@')[0]}
                              </p>
                              <p className="text-[10px] text-zinc-500 truncate">{member.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {canManageTarget ? (
                              <>
                                <div className="w-32 text-xs">
                                  <SearchableSelect
                                    options={[
                                      { value: 'admin', label: 'Administrador' },
                                      { value: 'collaborator', label: 'Colaborador' },
                                      { value: 'reader', label: 'Leitor' },
                                    ]}
                                    value={member.role || 'collaborator'}
                                    onChange={newVal => handleRoleChange(member.id, newVal)}
                                    placeholder="Cargo..."
                                  />
                                </div>
                                
                                <button
                                  onClick={() => setMemberToRemove(member)}
                                  className={`p-1 text-zinc-500 hover:text-rose-550 rounded hover:bg-zinc-500/10 cursor-pointer`}
                                  title="Remover integrante"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center">
                                {getRoleBadge(member.role)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Modal Footer actions for STEP 1 */}
                <div className={`p-4 border-t flex justify-end gap-2 bg-black/5 ${styles.borderClass}`}>
                  {canManageMembers && (
                    <button 
                      onClick={() => {
                        setSelectedUserIds([]);
                        setModalStep('add');
                      }}
                      className={`h-8.5 px-4 text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 cursor-pointer ${styles.btnPrimaryClass}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Integrantes</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* STEP 2: ADD MEMBERS STEP */}
            {modalStep === 'add' && (
              <>
                {/* Search available unregistered users */}
                <div className="p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder="Pesquisar usuários cadastrados no Nexion..."
                      value={addSearchTerm}
                      onChange={e => setAddSearchTerm(e.target.value)}
                      className={`w-full text-xs pl-9 pr-4 py-2 border rounded-md outline-none transition-all ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
                    />
                  </div>

                  {/* Batch configuration role selector */}
                  <div className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-black/5 ${styles.borderClass}`}>
                    <div>
                      <span className={`block font-semibold uppercase tracking-wider text-[10px] ${theme === 'light' ? 'text-zinc-800' : 'text-zinc-300'}`}>Definir Cargo de Entrada:</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">As pessoas selecionadas abaixo herdarão este perfil de acesso.</p>
                    </div>
                    <div className="w-40">
                      <SearchableSelect
                        options={[
                          { value: 'admin', label: 'Administrador' },
                          { value: 'collaborator', label: 'Colaborador' },
                          { value: 'reader', label: 'Leitor' },
                        ]}
                        value={chosenAddRole}
                        onChange={val => setChosenAddRole(val as any)}
                        placeholder="Cargo de entrada"
                      />
                    </div>
                  </div>
                </div>

                {/* Checkbox selector area */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
                  {filteredAvailableUsers.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Todos os usuários já fazem parte deste projeto</p>
                    </div>
                  ) : (
                    filteredAvailableUsers.map(userItem => {
                      const isSelected = selectedUserIds.includes(userItem.uid);
                      return (
                        <div 
                          key={userItem.uid}
                          onClick={() => toggleUserSelection(userItem.uid)}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? (theme === 'light' ? 'bg-zinc-100 border-zinc-400' : 'bg-[#10b981]/5 border-[#10b981]/30')
                              : (theme === 'light' ? 'bg-zinc-50/50 hover:bg-zinc-50' : 'bg-black/10 hover:bg-black/20')
                          } ${styles.borderClass}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                            <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border-2 shrink-0 ${
                              isSelected ? 'bg-emerald-500 text-white' : styles.accentBgClass
                            } ${styles.accentBorderClass}`}>
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : (userItem.name ? userItem.name[0] : userItem.email[0]).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${theme === 'light' ? 'text-zinc-800' : 'text-zinc-150'}`}>
                                {userItem.name || userItem.email.split('@')[0]}
                              </p>
                              <p className="text-[10px] text-zinc-500 truncate">{userItem.email}</p>
                            </div>
                          </div>

                          <div className="pointer-events-none shrink-0">
                            <div className={`w-4.5 h-4.5 rounded border-2 transition-all flex items-center justify-center ${
                              isSelected 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'border-zinc-500'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Modal Footer actions for STEP 2 */}
                <div className={`p-4 border-t flex items-center justify-between bg-black/5 ${styles.borderClass}`}>
                  <button 
                    onClick={() => setModalStep('list')}
                    className={`h-8.5 px-4 text-xs font-semibold uppercase tracking-wider rounded-md border text-zinc-300 cursor-pointer ${styles.btnSecondaryClass}`}
                  >
                    Voltar
                  </button>

                  <button 
                    disabled={selectedUserIds.length === 0 || isSavingBatch}
                    onClick={handleBatchAddMembers}
                    className={`h-8.5 px-4 text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-40 select-none ${styles.btnPrimaryClass}`}
                  >
                    {isSavingBatch ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Adicionando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Adicionar Selecionados ({selectedUserIds.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* SCREEN POPUP CONFIRMATION TO REPLICATE COMPREHENSIVE ON-SCREEN MODAL CONFIRM */}
            {memberToRemove && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-200 z-50">
                <div className={`w-full max-w-sm rounded-xl p-6 border transition-all ${styles.cardBgClass} ${
                  theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
                } ${styles.borderClass}`}>
                  <h4 className={`text-sm font-bold tracking-tight uppercase font-mono flex items-center gap-2 ${
                    theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'
                  }`}>
                    <Shield className="w-4 h-4 text-rose-500" />
                    Confirmar Exclusão
                  </h4>
                  <p className={`text-xs mt-3 leading-relaxed ${
                    theme === 'light' ? 'text-zinc-650' : 'text-zinc-400'
                  }`}>
                    Você tem certeza que deseja remover <strong className={theme === 'light' ? 'text-zinc-900 font-bold' : 'text-zinc-200'}>{memberToRemove.name || memberToRemove.email}</strong> deste projeto?
                  </p>
                  <p className={`text-[10px] mt-1 ${
                    theme === 'light' ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Este integrante perderá acesso completo e visualização a este quadro de tarefas.
                  </p>
                  <div className="flex gap-2 justify-end mt-5">
                    <button 
                      onClick={() => setMemberToRemove(null)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                        theme === 'light' 
                          ? 'border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50' 
                          : 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={executeRemoveMember}
                      className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer"
                    >
                      Confirmar Remoção
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CONTEXT MENU FLOATING OPTIONS */}
      {contextMenu && (
        <div 
          className="fixed inset-0 z-50 bg-transparent select-none cursor-default" 
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        >
          <div 
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className={`fixed z-60 min-w-[175px] rounded-lg border p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 ${
              theme === 'light' ? 'bg-white/95 border-zinc-200 text-zinc-800' : 'bg-zinc-950/95 border-zinc-800 text-zinc-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'column' ? (
              <button
                onClick={() => {
                  setAddTaskColumnId(contextMenu.targetId);
                  setAddFormTitle('');
                  setAddFormDesc('');
                  setAddFormAssigneeIds(user?.uid ? [user.uid] : []);
                  setContextMenu(null);
                }}
                className={`w-full text-left px-3 py-2 text-[10.5px] rounded font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                  theme === 'light' ? 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-zinc-500" />
                Criar Task
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditingTask(contextMenu.task);
                    setEditFormTitle(contextMenu.task?.title || '');
                    setEditFormDesc(contextMenu.task?.description || '');
                    setEditFormAssigneeIds(contextMenu.task?.assigneeIds || (contextMenu.task?.assigneeId ? [contextMenu.task.assigneeId] : []));
                    setEditFormTags(contextMenu.task?.tags || []);
                    setEditFormTimerType(contextMenu.task?.dueDate ? 'datetime' : 'none');
                    try {
                      // Convert Timestamp or JS Date safely
                      const dateVal = contextMenu.task?.dueDate;
                      if (dateVal) {
                        const dateObj = (dateVal as any).toDate ? (dateVal as any).toDate() : new Date(dateVal);
                        // Adjust to local ISO datetime-local input format
                        const tzo = dateObj.getTimezoneOffset() * 60000;
                        const localISOTime = (new Date(dateObj.getTime() - tzo)).toISOString().slice(0, 16);
                        setEditFormDueDate(localISOTime);
                      } else {
                        setEditFormDueDate('');
                      }
                    } catch (e) {
                      setEditFormDueDate('');
                    }
                    setEditFormTargetColumnId(contextMenu.task?.targetColumnId || '');
                    setEditFormPriority(contextMenu.task?.priority || 'medium');
                    setContextMenu(null);
                  }}
                  className={`w-full text-left px-3 py-2 text-[10.5px] rounded font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                    theme === 'light' ? 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                  Editar Task
                </button>
                
                {canEditKanban && (
                  <button
                    onClick={() => {
                      setTaskToDelete(contextMenu.task);
                      setContextMenu(null);
                    }}
                    className={`w-full text-left px-3 py-2 text-[10.5px] rounded font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer border-t mt-1 pt-2 transition-colors ${
                      theme === 'light' ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50/85 border-zinc-100' : 'text-rose-450 hover:text-rose-300 hover:bg-rose-955/20 border-zinc-900'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    Excluir Task
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR NOVA TAREFA NA COLUNA */}
      <AddTaskModal
        isOpen={!!addTaskColumnId}
        onClose={() => setAddTaskColumnId(null)}
        members={projectMembers}
        columns={useKanbanStore.getState().columns}
        isSaving={isSavingNewTask}
        theme={theme}
        styles={styles}
        onSubmit={async (data) => {
          setIsSavingNewTask(true);
          try {
            const relevantTasks = useKanbanStore.getState().tasks.filter(t => t.columnId === addTaskColumnId);
            const order = relevantTasks.length * 1000;

            let finalDueDate: Date | null = null;
            if (data.timerType === 'datetime' && data.dueDate) {
              finalDueDate = new Date(data.dueDate);
            } else if (data.timerType === 'duration' && data.durationValue > 0) {
              const multiplier = data.durationUnit === 'hours' ? 60 * 60 * 1000 : 60 * 1000;
              finalDueDate = new Date(Date.now() + data.durationValue * multiplier);
            }

            await kanbanService.addTask(
              projectId,
              addTaskColumnId!,
              data.title,
              order,
              data.description,
              data.assigneeIds[0] || '',
              data.priority,
              data.assigneeIds,
              data.tags,
              finalDueDate,
              data.targetColumnId || null,
              data.subtasks,
              data.color
            );
            setAddTaskColumnId(null);
          } catch (err: any) {
            alert('Erro ao adicionar tarefa: ' + err.message);
          } finally {
            setIsSavingNewTask(false);
          }
        }}
      />

      {/* MODAL: EDITAR TAREFA */}
      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        members={projectMembers}
        columns={useKanbanStore.getState().columns}
        isSaving={isSavingEditTask}
        theme={theme}
        styles={styles}
        onSubmit={async (data) => {
          setIsSavingEditTask(true);
          try {
            let finalDueDate: Date | null = null;
            if (data.timerType === 'datetime' && data.dueDate) {
              finalDueDate = new Date(data.dueDate);
            } else if (data.timerType === 'duration' && data.durationValue > 0) {
              const multiplier = data.durationUnit === 'hours' ? 60 * 60 * 1000 : 60 * 1050;
              finalDueDate = new Date(Date.now() + data.durationValue * multiplier);
            }

            await kanbanService.updateTask(projectId, editingTask.id, {
              title: data.title,
              description: data.description,
              assigneeId: data.assigneeIds[0] || null,
              assigneeIds: data.assigneeIds,
              tags: data.tags,
              dueDate: finalDueDate,
              targetColumnId: data.targetColumnId || null,
              priority: data.priority,
              subtasks: data.subtasks,
              color: data.color
            });
            setEditingTask(null);
          } catch (err: any) {
            alert('Erro ao editar tarefa: ' + err.message);
          } finally {
            setIsSavingEditTask(false);
          }
        }}
      />

      {/* SCREEN POPUP CONFIRMATION TO REPLICATE COMPREHENSIVE ON-SCREEN MODAL CONFIRM */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-200 z-50">
          <div className={`w-full max-w-sm rounded-xl p-6 border transition-all ${styles.cardBgClass} ${
            theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-805'
          } ${styles.borderClass}`}>
            <h4 className={`text-sm font-bold tracking-tight uppercase font-mono flex items-center gap-2 ${
              theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'
            }`}>
              <Shield className="w-4 h-4 text-rose-500" />
              Confirmar Exclusão
            </h4>
            <p className={`text-xs mt-3 leading-relaxed ${
              theme === 'light' ? 'text-zinc-650' : 'text-zinc-400'
            }`}>
              Você tem certeza que deseja excluir permanentemente a task <strong className={theme === 'light' ? 'text-zinc-900 font-bold' : 'text-zinc-200'}>{taskToDelete.title}</strong>?
            </p>
            <p className={`text-[10px] mt-1 ${
              theme === 'light' ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              Esta ação é definitiva e removerá a tarefa de todos os integrantes.
            </p>
            <div className="flex gap-2 justify-end mt-5">
              <button 
                onClick={() => setTaskToDelete(null)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  theme === 'light' 
                    ? 'border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50' 
                    : 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Cancelar
              </button>
              <button 
                disabled={isDeletingTask}
                onClick={executeDeleteTask}
                className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer flex items-center gap-1"
              >
                {isDeletingTask ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Confirmar Exclusão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM CONFIRMATION FOR DELETE COLUMN */}
      {columnToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-200 z-50">
          <div className={`w-full max-w-sm rounded-xl p-6 border transition-all ${styles.cardBgClass} ${
            theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-805'
          } ${styles.borderClass}`}>
            <h4 className={`text-sm font-bold tracking-tight uppercase font-mono flex items-center gap-2 ${
              theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'
            }`}>
              <Shield className="w-4 h-4 text-rose-500" />
              Excluir Coluna
            </h4>
            <p className={`text-xs mt-3 leading-relaxed ${
              theme === 'light' ? 'text-zinc-650' : 'text-zinc-400'
            }`}>
              Tem certeza que deseja apagar a coluna <strong className={theme === 'light' ? 'text-zinc-900 font-bold' : 'text-zinc-200'}>{columnToDelete.name}</strong> e TODAS as suas tarefas?
            </p>
            <p className={`text-[10px] mt-1 ${
              theme === 'light' ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              Ao confirmar, essa operação não poderá ser revertida.
            </p>
            <div className="flex gap-2 justify-end mt-5">
              <button 
                onClick={() => setColumnToDelete(null)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  theme === 'light' 
                    ? 'border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50' 
                    : 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Cancelar
              </button>
              <button 
                disabled={isDeletingColumn}
                onClick={executeDeleteColumn}
                className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer flex items-center gap-1"
              >
                {isDeletingColumn ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Apagar Coluna</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXIBIR INFORMAÇÕES DETALHADAS DA TASK */}
      {viewingTask && (() => {
        // Safe arrays
        const assigneeIds = viewingTask.assigneeIds || (viewingTask.assigneeId ? [viewingTask.assigneeId] : []);
        const assignees = projectMembers.filter(m => assigneeIds.includes(m.id));
        const tags = viewingTask.tags || [];

        const columnsList = useKanbanStore.getState().columns;
        const currentColumn = columnsList.find(c => c.id === viewingTask.columnId);
        const targetColumn = viewingTask.targetColumnId ? columnsList.find(c => c.id === viewingTask.targetColumnId) : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-lg rounded-xl shadow-xl relative overflow-visible flex flex-col border transition-all ${styles.cardBgClass} ${styles.borderClass}`}>
              
              <div className={`p-5 flex items-center justify-between border-b ${styles.borderClass}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[9px] uppercase tracking-wider rounded font-bold px-2 py-0.5 border ${styles.kbdOrBadgeClass}`}>Task</span>
                  <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
                    Detalhes da Task
                  </h3>
                </div>
                <button 
                  onClick={() => setViewingTask(null)}
                  className="p-1.5 rounded-lg hover:bg-zinc-500/10 text-zinc-500 hover:text-zinc-150 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1">Título</h4>
                  <p className={`text-sm font-bold tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
                    {viewingTask.title}
                  </p>
                </div>

                {viewingTask.description && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1">Descrição</h4>
                    <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-650' : 'text-zinc-250'}`}>
                      {viewingTask.description}
                    </p>
                  </div>
                )}

                {/* Sub-grid of details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Responsáveis */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1.5 font-semibold">Responsáveis</h4>
                    {assignees.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {assignees.map((m) => (
                          <div key={m.id} className="flex items-center gap-2.5 font-normal">
                            {m.photoURL ? (
                              <img src={m.photoURL} alt="" className="w-5 h-5 rounded-full" />
                            ) : (
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border uppercase ${getAvatarColor(m.id)}`}>
                                {(m.name ? m.name[0] : m.email[0]).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 font-normal">
                              <p className={`text-xs font-semibold truncate ${theme === 'light' ? 'text-zinc-800' : 'text-zinc-350'}`}>
                                {m.name || m.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">Sem responsável atribuído</p>
                    )}
                  </div>

                  {/* Prioridade e Objetivo */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1.5 font-semibold">Prioridade</h4>
                      {viewingTask.priority ? (
                        <div className="flex font-mono items-center">
                          <span className={`text-[9.5px] uppercase tracking-wider rounded-md px-2.5 py-1 font-bold flex items-center gap-1.5 ${
                            viewingTask.priority === 'high' 
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                              : viewingTask.priority === 'medium'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{viewingTask.priority === 'high' ? 'Alta' : viewingTask.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic font-normal">Nenhuma definida</p>
                      )}
                    </div>

                    {targetColumn && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1 font-semibold">Coluna Objetivo</h4>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25 uppercase font-mono text-[9px] flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                            {targetColumn.name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags Section */}
                {tags.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1.5">Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag: string, idx: number) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono border bg-zinc-500/10 text-zinc-300 border-zinc-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtasks Section */}
                {viewingTask.subtasks && viewingTask.subtasks.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-2">Subtasks</h4>
                    <div className="flex flex-col gap-1.5">
                      {viewingTask.subtasks.map((st: any, idx: number) => (
                        <div key={st.id} className="flex items-center gap-2 p-2 rounded-md border bg-zinc-900/30 border-zinc-800/50">
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={async () => {
                              const newSubtasks = [...viewingTask.subtasks];
                              newSubtasks[idx] = { ...st, completed: !st.completed };
                              
                              // Update local state for immediate feedback
                              setViewingTask({ ...viewingTask, subtasks: newSubtasks });
                              
                              // Update store temporarily
                              const tasks = useKanbanStore.getState().tasks;
                              const tIdx = tasks.findIndex(t => t.id === viewingTask.id);
                              if (tIdx > -1) {
                                const newTasks = [...tasks];
                                newTasks[tIdx] = { ...newTasks[tIdx], subtasks: newSubtasks };
                                useKanbanStore.getState().setTasks(newTasks);
                              }

                              try {
                                await kanbanService.updateTask(projectId, viewingTask.id, {
                                  title: viewingTask.title,
                                  subtasks: newSubtasks
                                });
                              } catch (err) {
                                console.error('Failed to update subtasks:', err);
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800/50 cursor-pointer"
                          />
                          <span className={`text-xs font-medium ${st.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deadlines Timer Status */}
                {viewingTask.dueDate && (
                  <div className={`p-3 rounded-lg border flex flex-col gap-1.5 ${styles.borderClass} bg-zinc-500/5`}>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">⏱️ Status do Prazo</h4>
                    <p className="text-xs text-zinc-300 font-mono">
                      Expira em: <span className="font-bold text-white">{new Date((viewingTask.dueDate as any).toDate ? (viewingTask.dueDate as any).toDate() : viewingTask.dueDate).toLocaleString()}</span>
                    </p>
                  </div>
                )}

                {/* Mudar Coluna Control */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1.5 font-semibold">Mover de Coluna</h4>
                  <div className="text-xs">
                    <SearchableSelect
                      options={columnsList.map(c => ({ value: c.id, label: c.name }))}
                      value={viewingTask.columnId}
                      onChange={async (newColumnId) => {
                        try {
                          const moveTask = useKanbanStore.getState().moveTask;
                          const colTasks = useKanbanStore.getState().tasks.filter(t => t.columnId === newColumnId);
                          await moveTask(projectId, viewingTask.id, newColumnId, colTasks.length);
                          setViewingTask({ ...viewingTask, columnId: newColumnId });
                        } catch (err: any) {
                          alert("Erro ao mover coluna: " + err.message);
                        }
                      }}
                      placeholder="Mudar status de coluna"
                    />
                  </div>
                </div>

                <div className={`pt-4 border-t flex justify-between items-center mt-2 ${styles.borderClass}`}>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const taskToEdit = viewingTask;
                        setViewingTask(null);
                        setEditingTask(taskToEdit);
                        setEditFormTitle(taskToEdit?.title || '');
                        setEditFormDesc(taskToEdit?.description || '');
                        setEditFormAssigneeIds(taskToEdit?.assigneeIds || (taskToEdit?.assigneeId ? [taskToEdit.assigneeId] : []));
                        setEditFormTags(taskToEdit?.tags || []);
                        setEditFormTimerType(taskToEdit?.dueDate ? 'datetime' : 'none');
                        try {
                          const dateVal = taskToEdit?.dueDate;
                          if (dateVal) {
                            const dateObj = (dateVal as any).toDate ? (dateVal as any).toDate() : new Date(dateVal);
                            const tzo = dateObj.getTimezoneOffset() * 60000;
                            const localISOTime = (new Date(dateObj.getTime() - tzo)).toISOString().slice(0, 16);
                            setEditFormDueDate(localISOTime);
                          } else {
                            setEditFormDueDate('');
                          }
                        } catch (e) {
                          setEditFormDueDate('');
                        }
                        setEditFormTargetColumnId(taskToEdit?.targetColumnId || '');
                        setEditFormPriority(taskToEdit?.priority || 'medium');
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border border-zinc-750 text-zinc-350 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer flex items-center gap-1.5 font-mono"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    
                    {canEditKanban && (
                      <button
                        type="button"
                        onClick={() => {
                          const taskToDel = viewingTask;
                          setViewingTask(null);
                          setTaskToDelete(taskToDel);
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border border-rose-900/50 text-rose-450 hover:bg-rose-950/20 transition-all cursor-pointer flex items-center gap-1.5 font-mono"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingTask(null)}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer ${styles.btnPrimaryClass}`}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
