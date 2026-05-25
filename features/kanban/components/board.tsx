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
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, useMemo, Fragment } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './task-card';

interface ColumnAddDividerProps {
  projectId: string;
  order: number;
  isReadOnly: boolean;
}

function ColumnAddDivider({ projectId, order, isReadOnly }: ColumnAddDividerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const { styles, theme } = useTheme();

  if (isReadOnly) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await kanbanService.addColumn(projectId, name.trim(), order);
      setName('');
      setIsAdding(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="relative w-6 shrink-0 h-full group flex flex-col items-center pt-3.5 select-none">
      {/* Linha vertical centralizada */}
      <div className={`absolute top-0 bottom-0 w-[2px] transition-colors duration-250 ${
        theme === 'light' 
          ? 'bg-zinc-200/60 group-hover:bg-zinc-400' 
          : 'bg-zinc-850/40 group-hover:bg-zinc-700'
      }`} />

      {/* Botão de + no topo */}
      <button
        type="button"
        onClick={() => setIsAdding(!isAdding)}
        className={`relative z-10 w-6 h-6 rounded-full border flex items-center justify-center shadow-md transition-all duration-200 transform scale-90 group-hover:scale-100 ${
          isAdding
            ? 'rotate-45 bg-rose-500 border-rose-650 text-white cursor-pointer'
            : theme === 'light'
              ? 'bg-white border-zinc-250 text-zinc-500 hover:text-zinc-850 hover:border-zinc-450 group-hover:opacity-100 opacity-0 cursor-pointer'
              : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 group-hover:opacity-100 opacity-0 cursor-pointer'
        }`}
        title="Nova coluna aqui"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      {/* Popover flutuante para digitação (absoluto) */}
      {isAdding && (
        <div 
          className={`absolute top-11 z-30 w-60 rounded-lg p-3 border shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-2 ${
            theme === 'light' 
              ? 'bg-white/95 border-zinc-200 text-zinc-850' 
              : 'bg-zinc-950/95 border-zinc-800 text-zinc-100'
          }`}
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Nome da coluna..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`text-xs border rounded-md px-3 py-1.5 w-full outline-none transition-all font-semibold ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <div className="flex gap-1.5 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-tight rounded bg-transparent text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-tight rounded font-bold cursor-pointer ${styles.btnPrimaryClass}`}
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

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
  onAddTaskClick,
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
  onAddTaskClick?: (columnId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const { styles, theme } = useTheme();

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
    disabled: isReadOnly
  });

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
                theme === 'light' ? 'text-zinc-650 hover:text-zinc-900 hover:bg-zinc-200' : 'text-zinc-350 hover:text-white hover:bg-zinc-800'
              }`} 
              onClick={() => onAddTaskClick && onAddTaskClick(column.id)}
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
  onAddTaskClick,
  filterColumnId = 'all',
  filterAssigneeId = 'all',
  filterSearchTerm = '',
  filterPriority = 'all',
  filterTag = 'all',
  filterTimer = 'all',
  filterColor = 'all',
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
  onAddTaskClick?: (columnId: string) => void;
  filterColumnId?: string;
  filterAssigneeId?: string;
  filterSearchTerm?: string;
  filterPriority?: string;
  filterTag?: string;
  filterTimer?: string;
  filterColor?: string;
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
      
      let matchAssignee = false;
      if (!filterAssigneeId || filterAssigneeId === 'all') {
        matchAssignee = true;
      } else if (filterAssigneeId === 'unassigned') {
        const hasAssignees = t.assigneeIds && t.assigneeIds.length > 0;
        matchAssignee = !t.assigneeId && !hasAssignees;
      } else {
        const inList = t.assigneeIds && t.assigneeIds.includes(filterAssigneeId);
        matchAssignee = t.assigneeId === filterAssigneeId || !!inList;
      }
      
      const matchPriority = !filterPriority || filterPriority === 'all' || t.priority === filterPriority;
      
      const cleanSearch = filterSearchTerm.trim().toLowerCase();
      const matchSearch = !cleanSearch || 
        t.title.toLowerCase().includes(cleanSearch) || 
        (t.description && t.description.toLowerCase().includes(cleanSearch));

      let matchTag = true;
      if (filterTag && filterTag !== 'all') {
        matchTag = t.tags ? t.tags.includes(filterTag) : false;
      }

      let matchTimer = true;
      if (filterTimer && filterTimer !== 'all') {
        if (filterTimer === 'has-timer') {
          matchTimer = !!t.dueDate;
        } else if (filterTimer === 'no-timer') {
          matchTimer = !t.dueDate;
        } else if (filterTimer === 'completed') {
          matchTimer = !!t.dueDate && t.targetColumnId === t.columnId;
        } else if (filterTimer === 'expired') {
          matchTimer = !!t.dueDate && t.targetColumnId !== t.columnId && new Date(t.dueDate).getTime() < Date.now();
        } else if (filterTimer === 'near') {
          if (!t.dueDate || t.targetColumnId === t.columnId) {
            matchTimer = false;
          } else {
            const diff = new Date(t.dueDate).getTime() - Date.now();
            matchTimer = diff > 0 && diff <= 15 * 60 * 1000;
          }
        }
      }

      let matchColor = true;
      if (filterColor && filterColor !== 'all') {
        matchColor = t.color === filterColor || (filterColor === 'default' && (!t.color || t.color === 'default'));
      }
        
      return matchCol && matchAssignee && matchPriority && matchSearch && matchTag && matchTimer && matchColor;
    });
  }, [rawTasks, filterColumnId, filterAssigneeId, filterPriority, filterSearchTerm, filterTag, filterTimer, filterColor]);

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
      <div className="flex h-full gap-2 w-full overflow-x-auto pb-4">
        {columns.length > 0 && (
          <ColumnAddDivider
            projectId={projectId}
            order={columns[0].order - 1000}
            isReadOnly={isReadOnly}
          />
        )}
        
        {columns.map((col, idx) => {
          const nextCol = columns[idx + 1];
          const midOrder = nextCol ? (col.order + nextCol.order) / 2 : col.order + 1000;
          return (
            <Fragment key={col.id}>
              <ColumnView 
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
                onAddTaskClick={onAddTaskClick}
              />
              <ColumnAddDivider
                projectId={projectId}
                order={midOrder}
                isReadOnly={isReadOnly}
              />
            </Fragment>
          );
        })}
        {columns.length === 0 && (
          <div className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-lg p-12 text-center bg-black/10 ${styles.borderClass}`}>
            <p className="text-zinc-200 font-semibold text-xs uppercase tracking-wider font-mono">Quadro sem colunas</p>
            <p className={`text-xs mt-2 max-w-[260px] leading-relaxed ${styles.textMutedClass}`}>Clique no divisor para adicionar uma coluna e começar a organizar as demandas.</p>
            <button
              type="button"
              onClick={() => kanbanService.addColumn(projectId, 'A Fazer', 1000)}
              className={`mt-4 h-8 px-4 rounded-md flex items-center gap-1.5 transition-all text-xs font-mono font-bold uppercase tracking-wider ${styles.btnPrimaryClass}`}
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Coluna Padrão
            </button>
          </div>
        )}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} members={members} projectId={projectId} isOverlay={true} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
