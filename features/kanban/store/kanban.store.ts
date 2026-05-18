'use client';

import { create } from 'zustand';
import { Column, Task } from '../schemas/kanban';
import { kanbanService } from '../services/kanban.service';

interface KanbanState {
  columns: Column[];
  tasks: Task[];
  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: Task[]) => void;
  moveTask: (projectId: string, taskId: string, newColumnId: string, newIndex: number) => void;
  moveColumn: (projectId: string, columnId: string, newIndex: number) => void;
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  columns: [],
  tasks: [],
  setColumns: (columns) => set({ columns }),
  setTasks: (tasks) => set({ tasks }),
  
  moveTask: (projectId, taskId, newColumnId, newIndex) => {
    // 1. Optimistic Update
    const { tasks } = get();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const oldColumnId = task.columnId;

    // Remove task from old list
    const newTasks = [...tasks];
    newTasks.splice(taskIndex, 1);

    // Filter tasks in new column, sort by order
    const columnTasks = newTasks.filter(t => t.columnId === newColumnId).sort((a, b) => a.order - b.order);
    
    // Insert at new index
    columnTasks.splice(newIndex, 0, { ...task, columnId: newColumnId });

    // Recalculate orders for all tasks in the new column
    const updates: { id: string; columnId: string; order: number }[] = [];
    columnTasks.forEach((t, i) => {
      const order = i * 1000;
      t.order = order;
      updates.push({ id: t.id, columnId: newColumnId, order });
    });

    // Update state
    set({
      tasks: newTasks.map(t => {
        const update = updates.find(u => u.id === t.id);
        return update ? { ...t, ...update } : t;
      })
    });

    // 2. Persist
    kanbanService.updateTaskBatch(projectId, updates).catch(console.error);
  },

  moveColumn: (projectId, columnId, newIndex) => {
    // Left as an exercise or similar logic
  }
}));
