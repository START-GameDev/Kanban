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
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './task-card';

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
      
      // Support filtering by assignee inside assigneeIds list too
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
          // eslint-disable-next-line react-hooks/purity
          matchTimer = !!t.dueDate && t.targetColumnId !== t.columnId && new Date(t.dueDate).getTime() < Date.now();
        } else if (filterTimer === 'near') {
          if (!t.dueDate || t.targetColumnId === t.columnId) {
            matchTimer = false;
          } else {
            // eslint-disable-next-line react-hooks/purity
            const diff = new Date(t.dueDate).getTime() - Date.now();
            matchTimer = diff > 0 && diff <= 15 * 60 * 1000;
          }
        }
      }
        
      return matchCol && matchAssignee && matchPriority && matchSearch && matchTag && matchTimer;
    });
  }, [rawTasks, filterColumnId, filterAssigneeId, filterPriority, filterSearchTerm, filterTag, filterTimer]);

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
            onAddTaskClick={onAddTaskClick}
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
