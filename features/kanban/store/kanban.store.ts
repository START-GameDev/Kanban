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
    const { tasks } = get();
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    // Filter out the moving task from old status and new status tasks to prevent duplications
    const otherTasks = tasks.filter(t => t.id !== taskId && t.columnId !== newColumnId);
    
    // Get all other tasks in the target column, sorted by order
    const targetColumnTasks = tasks
      .filter(t => t.id !== taskId && t.columnId === newColumnId)
      .sort((a, b) => a.order - b.order);

    // Insert taskToMove at the specified newIndex in the target column array
    const updatedTask = { ...taskToMove, columnId: newColumnId };
    targetColumnTasks.splice(newIndex, 0, updatedTask);

    // Recalculate orders for all tasks in the target column
    const updates: { id: string; columnId: string; order: number }[] = [];
    targetColumnTasks.forEach((t, i) => {
      const order = i * 1000;
      t.order = order;
      updates.push({ id: t.id, columnId: newColumnId, order });
    });

    // Merge other columns' tasks with the updated target column's tasks
    const finalTasks = [
      ...otherTasks,
      ...targetColumnTasks
    ];

    set({ tasks: finalTasks });

    // 2. Persist to Firestore
    kanbanService.updateTaskBatch(projectId, updates).catch(console.error);
  },

  moveColumn: (projectId, columnId, newIndex) => {
    // Left as an exercise or similar logic
  }
}));
