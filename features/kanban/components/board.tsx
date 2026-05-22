'use client';

import { useKanbanStore } from '../store/kanban.store';
import { Column, Task } from '../schemas/kanban';
import { kanbanService } from '../services/kanban.service';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './task-card';
import { SearchableSelect } from '@/components/ui/searchable-select';

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
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

function ColumnView({ 
  column, 
  tasks, 
  projectId, 
  members, 
  isReadOnly,
  onColumnContextMenu,
  onTaskContextMenu,
  onDeleteTaskClick,
  onEditTaskClick,
  onDeleteColumnClick,
  onCardClick,
}: { 
  column: Column; 
  tasks: Task[]; 
  projectId: string; 
  members: any[]; 
  isReadOnly?: boolean;
  onColumnContextMenu?: (e: React.MouseEvent, columnId: string) => void;
  onTaskContextMenu?: (e: React.MouseEvent, task: Task) => void;
  onDeleteTaskClick?: (task: Task) => void;
  onEditTaskClick?: (task: Task) => void;
  onDeleteColumnClick?: (column: Column) => void;
  onCardClick?: (task: Task) => void;
}) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  
  const { user } = useAuth();
  const [newTaskAssignee, setNewTaskAssignee] = useState(user?.uid || '');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const { styles, theme } = useTheme();

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
    disabled: isReadOnly
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const order = tasks.length * 1000;
      await kanbanService.addTask(projectId, column.id, newTaskTitle.trim(), order, newTaskDesc.trim(), newTaskAssignee);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskAssignee(user?.uid || '');
      setIsAddingTask(false);
    } catch (error: any) {
      console.error(error);
      alert("Erro ao adicionar tarefa: " + error.message);
    }
  };

  const handleEditColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || editName.trim() === column.name) return setIsEditing(false);
    
    try {
      await kanbanService.updateColumn(projectId, column.id, editName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar coluna");
    }
  };

  const handleDeleteColumn = () => {
    if (onDeleteColumnClick) {
      onDeleteColumnClick(column);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      onContextMenu={(e) => {
        if (isReadOnly) return;
        e.preventDefault();
        if (onColumnContextMenu) {
          onColumnContextMenu(e, column.id);
        }
      }}
      className={`flex flex-col flex-1 min-w-[290px] max-w-sm rounded-lg p-4 border h-full relative overflow-hidden transition-colors duration-200 ${
        theme === 'light' ? 'bg-zinc-100/50' : 'bg-black/15'
      } ${styles.borderClass}`}
    >
      <div className="flex items-center justify-between mb-4.5 px-1 group">
        {isEditing ? (
          <form onSubmit={handleEditColumn} className="flex-1 flex gap-2">
            <input 
              autoFocus
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className={`text-xs border rounded-md px-3 py-1.5 w-full outline-none transition-all font-semibold ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
              onBlur={() => {
                 if(editName.trim() === '') setEditName(column.name);
                 setIsEditing(false);
              }}
            />
          </form>
        ) : (
          <div className="flex items-center gap-2 select-none overflow-hidden mr-2">
            <span className={`truncate max-w-[130px] font-bold tracking-tight uppercase font-mono ${styles.columnHeaderClass}`}>{column.name}</span>
            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-mono font-medium border ${styles.kbdOrBadgeClass}`}>{tasks.length}</span>
          </div>
        )}
        
        {!isEditing && !isReadOnly && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button 
              className={`p-1 rounded cursor-pointer transition-colors ${
                theme === 'light' ? 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-805/40'
              }`} 
              onClick={() => setIsEditing(true)}
              title="Editar coluna"
            >
              <Pencil className="w-3.5 h-3.5 cursor-pointer animate-in duration-100" />
            </button>
            <button 
              className={`p-1 rounded cursor-pointer transition-colors ${
                theme === 'light' ? 'text-zinc-500 hover:text-rose-600 hover:bg-rose-50/80' : 'text-zinc-400 hover:text-rose-450 hover:bg-zinc-805/40'
              }`} 
              onClick={handleDeleteColumn}
              title="Excluir coluna"
            >
              <Trash2 className="w-3.5 h-3.5 cursor-pointer animate-in duration-100" />
            </button>
            <button 
              className={`p-1 rounded ml-1 cursor-pointer transition-colors ${
                theme === 'light' ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200' : 'text-zinc-350 hover:text-white hover:bg-zinc-800'
              }`} 
              onClick={() => setIsAddingTask(true)}
              title="Adicionar tarefa nesta coluna"
            >
              <Plus className="w-3.5 h-3.5 cursor-pointer animate-in duration-100" />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-0.5 pb-2 list-container">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              members={members} 
              projectId={projectId} 
              isReadOnly={isReadOnly} 
              onContextMenu={(e) => onTaskContextMenu && onTaskContextMenu(e, task)}
              onDeleteClick={() => onDeleteTaskClick && onDeleteTaskClick(task)}
              onEditClick={() => onEditTaskClick && onEditTaskClick(task)}
              onCardClick={() => onCardClick && onCardClick(task)}
            />
          ))}
        </SortableContext>

        {isAddingTask && !isReadOnly && (
          <form onSubmit={handleAddTask} className={`p-4 flex flex-col gap-3 rounded-md border duration-150 animate-in fade-in zoom-in-95 ${
            theme === 'light' ? 'bg-white' : 'bg-black/40'
          } ${styles.borderClass}`}>
            <input
              required
              autoFocus
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Título da tarefa..."
              className={`text-xs rounded-md px-3 py-1.5 placeholder:text-zinc-400 outline-none transition-all border ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
            />
            <textarea
              value={newTaskDesc}
              onChange={e => setNewTaskDesc(e.target.value)}
              placeholder="Descrição (opcional)..."
              rows={2}
              className={`w-full text-xs rounded-md px-3 py-1.5 resize-none placeholder:text-zinc-400 outline-none transition-all border ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
            />
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Responsável</span>
              <SearchableSelect
                options={[
                  { value: '', label: 'Sem responsável' },
                  ...members.map(m => ({
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
                value={newTaskAssignee}
                onChange={setNewTaskAssignee}
                placeholder="Selecionar responsável"
                searchPlaceholder="Pesquisar..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <button 
                type="button"
                onClick={() => setIsAddingTask(false)}
                className={`text-[9px] font-semibold uppercase tracking-wider py-1 px-2 text-zinc-450 hover:text-zinc-200 cursor-pointer`}
              >
                Voltar
              </button>
              <button 
                type="submit"
                className={`text-[9px] font-semibold uppercase tracking-wider py-1 px-3.5 rounded-md cursor-pointer ${styles.btnPrimaryClass}`}
              >
                Salvar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function Board({ 
  projectId, 
  members, 
  currentUserRole,
  onColumnContextMenu,
  onTaskContextMenu,
  onDeleteTaskClick,
  onEditTaskClick,
  onDeleteColumnClick,
  onCardClick,
  filterColumnId = 'all',
  filterAssigneeId = 'all',
}: { 
  projectId: string; 
  members: any[]; 
  currentUserRole?: string;
  onColumnContextMenu?: (e: React.MouseEvent, columnId: string) => void;
  onTaskContextMenu?: (e: React.MouseEvent, task: Task) => void;
  onDeleteTaskClick?: (task: Task) => void;
  onEditTaskClick?: (task: Task) => void;
  onDeleteColumnClick?: (column: Column) => void;
  onCardClick?: (task: Task) => void;
  filterColumnId?: string;
  filterAssigneeId?: string;
}) {
  const columns = useKanbanStore(s => s.columns);
  const rawTasks = useKanbanStore(s => s.tasks);
  const moveTask = useKanbanStore(s => s.moveTask);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { styles } = useTheme();

  const isReadOnly = currentUserRole === 'reader';

  const tasks = useMemo(() => {
    return rawTasks.filter(t => {
      const matchCol = !filterColumnId || filterColumnId === 'all' || t.columnId === filterColumnId;
      const matchAssignee = !filterAssigneeId || filterAssigneeId === 'all'
        || (filterAssigneeId === 'unassigned' && !t.assigneeId)
        || t.assigneeId === filterAssigneeId;
      return matchCol && matchAssignee;
    });
  }, [rawTasks, filterColumnId, filterAssigneeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (isReadOnly) return;
    const { active } = event;
    if (active.data.current?.type === 'Task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isReadOnly) return;
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    
    const activeTaskId = active.id as string;
    const overId = over.id as string;
    const overTask = tasks.find(t => t.id === overId);
    let newColumnId = '';
    let newIndex = 0;

    if (overTask) {
      newColumnId = overTask.columnId;
      const columnTasks = tasks.filter(t => t.columnId === newColumnId).sort((a, b) => a.order - b.order);
      newIndex = columnTasks.findIndex(t => t.id === overTask.id);
    } else {
      const overColumn = columns.find(c => c.id === overId) || (over.data.current?.type === 'Column' ? over.data.current.column : null);
      if (overColumn) {
        newColumnId = overColumn.id;
        newIndex = tasks.filter(t => t.columnId === newColumnId).length;
      }
    }

    if (newColumnId) {
       moveTask(projectId, activeTaskId, newColumnId, newIndex);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-4 w-full overflow-x-auto pb-4">
        {columns.map(col => (
          <ColumnView 
            key={col.id} 
            column={col} 
            tasks={tasks.filter(t => t.columnId === col.id).sort((a,b) => a.order - b.order)} 
            projectId={projectId}
            members={members}
            isReadOnly={isReadOnly}
            onColumnContextMenu={onColumnContextMenu}
            onTaskContextMenu={onTaskContextMenu}
            onDeleteTaskClick={onDeleteTaskClick}
            onEditTaskClick={onEditTaskClick}
            onDeleteColumnClick={onDeleteColumnClick}
            onCardClick={onCardClick}
          />
        ))}
        {columns.length === 0 && (
          <div className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-lg p-12 text-center bg-black/10 ${styles.borderClass}`}>
            <p className="text-zinc-200 font-semibold text-xs uppercase tracking-wider font-mono">Quadro sem colunas</p>
            <p className={`text-xs mt-2 max-w-[260px] leading-relaxed ${styles.textMutedClass}`}>Clique no botão &quot;Nova Coluna&quot; acima para começar a organizar as demandas de seu time.</p>
          </div>
        )}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} members={members} projectId={projectId} isOverlay={true} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
