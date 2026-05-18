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
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import { useAuth } from '@/providers/auth-provider';
import { Pencil, Trash2 } from 'lucide-react';

function TaskCard({ task, members }: { task: Task, members: any[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignee = members.find(m => m.id === task.assigneeId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-indigo-500/20 ${
        isDragging ? 'opacity-50 ring-2 ring-indigo-500' : 'opacity-100'
      }`}
    >
      <p className="text-sm font-semibold mt-1 mb-2 text-slate-900">{task.title}</p>
      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}
      {assignee && (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold" title={assignee.email}>
            {assignee.name ? assignee.name[0].toUpperCase() : assignee.email[0].toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}

import { useDroppable } from '@dnd-kit/core';

function ColumnView({ column, tasks, projectId, members }: { column: Column; tasks: Task[]; projectId: string, members: any[] }) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  
  const { user } = useAuth();
  const [newTaskAssignee, setNewTaskAssignee] = useState(user?.uid || '');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column
    }
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
      console.error("Erro ao adicionar tarefa:", error);
      alert("Erro ao adicionar tarefa: " + (error.message || "Erro desconhecido"));
    }
  };

  const handleEditColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsEditing(false);
    if (editName.trim() === column.name) return;
    
    try {
      await kanbanService.updateColumn(projectId, column.id, editName.trim());
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar coluna");
    }
  };

  const handleDeleteColumn = async () => {
    if (!confirm("Tem certeza que deseja apagar esta coluna e TODAS as suas tarefas?")) return;
    try {
      await kanbanService.deleteColumn(projectId, column.id);
    } catch (error) {
      console.error(error);
      alert("Erro ao apagar coluna");
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col flex-1 min-w-[280px] max-w-sm bg-slate-100/50 rounded-xl p-3 border border-slate-200 h-full"
    >
      <div className="flex items-center justify-between mb-4 px-1 group">
        {isEditing ? (
          <form onSubmit={handleEditColumn} className="flex-1 flex gap-2">
            <input 
              autoFocus
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="text-sm border border-indigo-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onBlur={() => {
                 if(editName.trim() === '') setEditName(column.name);
                 setIsEditing(false);
                 handleEditColumn(new Event('submit') as any);
              }}
            />
          </form>
        ) : (
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 flex items-center flex-1">
            {column.name}
            <span className="ml-2 text-xs py-0.5 px-2 bg-slate-200 rounded-full text-slate-600 font-normal">{tasks.length}</span>
          </h3>
        )}
        
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4" />
            </button>
            <button className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50" onClick={handleDeleteColumn}>
              <Trash2 className="w-4 h-4" />
            </button>
            <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 ml-1" onClick={() => setIsAddingTask(true)}>
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-1 pb-4">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} members={members} />
          ))}
        </SortableContext>

        {isAddingTask && (
          <form onSubmit={handleAddTask} className="bg-white p-3 flex flex-col gap-2 rounded-lg border border-indigo-500/30 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <input
              autoFocus
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Título da tarefa..."
              className="text-sm font-semibold text-slate-900 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 placeholder:text-slate-400 placeholder:font-normal"
            />
            <textarea
              value={newTaskDesc}
              onChange={e => setNewTaskDesc(e.target.value)}
              placeholder="Descrição (opcional)..."
              rows={2}
              className="w-full text-xs text-slate-700 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 resize-none placeholder:text-slate-400"
            />
            <select
              value={newTaskAssignee}
              onChange={e => setNewTaskAssignee(e.target.value)}
              className="text-xs border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-slate-700 bg-white"
            >
              <option value="">Sem responsável</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name || m.email}</option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button 
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-colors shadow-sm"
              >
                Adicionar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function Board({ projectId, members }: { projectId: string; members: any[] }) {
  const columns = useKanbanStore(s => s.columns);
  const tasks = useKanbanStore(s => s.tasks);
  const moveTask = useKanbanStore(s => s.moveTask);
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    
    // In dnd-kit, the 'over' can be another task or the column itself.
    // For simplicity, we just need to identify the column we dropped into and the index.
    
    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Is over a task?
    const overTask = tasks.find(t => t.id === overId);
    let newColumnId = '';
    let newIndex = 0;

    if (overTask) {
      newColumnId = overTask.columnId;
      const columnTasks = tasks.filter(t => t.columnId === newColumnId).sort((a,b)=>a.order-b.order);
      newIndex = columnTasks.findIndex(t => t.id === overTask.id);
    } else if (over.data.current?.type === 'Column') {
      newColumnId = over.id as string;
      const columnTasks = tasks.filter(t => t.columnId === newColumnId).sort((a,b)=>a.order-b.order);
      newIndex = columnTasks.length;
    }

    if (newColumnId) {
       // Check if active is moving down or up. If moving down, index might need +1 depending on state, but store logic handles insertion.
       moveTask(projectId, activeTaskId, newColumnId, newIndex);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 w-full overflow-x-auto pb-4">
        {columns.map(col => (
          <ColumnView 
            key={col.id} 
            column={col} 
            tasks={tasks.filter(t => t.columnId === col.id).sort((a,b) => a.order - b.order)} 
            projectId={projectId}
            members={members}
          />
        ))}
        {columns.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 opacity-70">
            <p className="text-slate-500 font-medium">Nenhuma coluna criada</p>
            <p className="text-sm text-slate-400">Adicione uma coluna para começar</p>
          </div>
        )}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} members={members} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
