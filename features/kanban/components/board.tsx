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

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      <p className="text-sm font-semibold mt-1 mb-3 text-slate-900">{task.title}</p>
    </div>
  );
}

import { useDroppable } from '@dnd-kit/core';

function ColumnView({ column, tasks, projectId }: { column: Column; tasks: Task[]; projectId: string }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column
    }
  });

  const handleAddTask = async () => {
    const title = prompt("Título da tarefa:");
    if (title) {
      const order = tasks.length * 1000;
      await kanbanService.addTask(projectId, column.id, title, order);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col w-1/4 min-w-[260px] bg-slate-100/50 rounded-xl p-3 border border-slate-200 h-full"
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">
          {column.name}
          <span className="ml-2 text-xs py-0.5 px-2 bg-slate-200 rounded-full text-slate-600 font-normal">{tasks.length}</span>
        </h3>
        <button className="text-slate-400 hover:text-slate-600" onClick={handleAddTask}>
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-1 pb-4">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function Board({ projectId }: { projectId: string }) {
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
      <div className="flex h-full gap-4">
        {columns.map(col => (
          <ColumnView 
            key={col.id} 
            column={col} 
            tasks={tasks.filter(t => t.columnId === col.id).sort((a,b) => a.order - b.order)} 
            projectId={projectId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
