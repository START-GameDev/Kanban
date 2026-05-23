'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { Task } from '../schemas/kanban';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Pencil, Timer, Clock, CheckCircle2, AlertTriangle, CheckSquare } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useKanbanStore } from '../store/kanban.store';

interface TaskCardProps {
  task: Task;
  members: any[];
  projectId: string;
  isOverlay?: boolean;
  isReadOnly?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
  onCardClick?: () => void;
}

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

export function TaskCard({ task, members, projectId, isOverlay, isReadOnly, onContextMenu, onDeleteClick, onEditClick, onCardClick }: TaskCardProps) {
  const { styles, theme } = useTheme();
  
  const sortable = useSortable({
    id: task.id,
    data: { type: 'Task', task },
    disabled: isOverlay || isReadOnly
  });

  const style = isOverlay ? undefined : {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const setNodeRef = isOverlay ? undefined : sortable.setNodeRef;
  const attributes = isOverlay || isReadOnly ? {} : sortable.attributes;
  const listeners = isOverlay || isReadOnly ? {} : sortable.listeners;
  const isDragging = isOverlay ? false : sortable.isDragging;

  // Multi-assignees resolution fallback to single assignee if empty
  const assigneeIds = task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []);
  const assignees = assigneeIds
    .map(id => members.find(m => m.id === id))
    .filter(Boolean);

  // States for real-time timer countdown
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isNear, setIsNear] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);
  const [isGoalMet, setIsGoalMet] = useState(false);

  useEffect(() => {
    if (!task.dueDate) {
      setIsGoalMet(false);
      setIsNear(false);
      setIsOverdue(false);
      setTimeLeft('');
      return;
    }

    let targetAchieved = false;
    if (task.targetColumnId) {
      const columns = useKanbanStore.getState().columns;
      const targetCol = columns.find(c => c.id === task.targetColumnId);
      const currentCol = columns.find(c => c.id === task.columnId);
      if (targetCol && currentCol && currentCol.order >= targetCol.order) {
        targetAchieved = true;
      }
    } else {
      targetAchieved = task.targetColumnId === task.columnId;
    }
    
    setIsGoalMet(targetAchieved);

    if (targetAchieved) {
      setTimeLeft('Meta atingida');
      setIsNear(false);
      setIsOverdue(false);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(task.dueDate!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Tempo expirado');
        setIsNear(false);
        setIsOverdue(true);
        return;
      }

      // Formatting
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      if (days === 0 && hours === 0) {
        parts.push(`${seconds}s`);
      }

      setTimeLeft(parts.join(' '));

      // Alarm / "Near deadline": less than 15 minutes left
      const nearThreshold = 15 * 60 * 1000;
      setIsNear(diff <= nearThreshold);
      setIsOverdue(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [task.dueDate, task.columnId, task.targetColumnId]);

  const handleDeleteTask = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteClick) {
      onDeleteClick();
    }
  };

  const isCyberpunk = theme === 'cyberpunk';

  // Compute glowing or highlight designs for the cards:
  const timerBorderClass = isGoalMet
    ? 'border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)] bg-emerald-500/[0.01]'
    : isNear
      ? 'border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse'
      : isOverdue
        ? 'border-rose-500/60 opacity-80'
        : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isReadOnly ? {} : attributes)}
      {...(isReadOnly ? {} : listeners)}
      onContextMenu={(e) => {
        if (isOverlay) return;
        if (isReadOnly) return;
        e.preventDefault();
        e.stopPropagation();
        if (onContextMenu) {
          onContextMenu(e);
        }
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        if (onCardClick) {
          onCardClick();
        }
      }}
      className={`p-4 border rounded-md hover:shadow-sm duration-150 transition-all select-none relative group ${styles.cardBgClass} ${styles.borderClass} ${timerBorderClass} ${
        isReadOnly ? 'cursor-default hover:border-zinc-300 dark:hover:border-zinc-750' : 'cursor-grab active:cursor-grabbing hover:border-zinc-400 dark:hover:border-zinc-650'
      } ${
        isDragging ? 'opacity-25 border-dashed bg-black/50' : 'opacity-100'
      }`}
    >
      {!isReadOnly && (
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-150 z-10">
          <button
            type="button"
            onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
            onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onEditClick) onEditClick();
            }}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-150 hover:bg-zinc-500/10 border border-transparent transition-all cursor-pointer"
            title="Editar tarefa"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
            onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
            onClick={handleDeleteTask}
            className="p-1.5 rounded-md text-zinc-500 hover:text-rose-450 hover:bg-rose-500/10 border border-transparent transition-all cursor-pointer"
            title="Excluir tarefa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Badges/Category section */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <span className={`font-mono text-[8px] uppercase tracking-wider rounded font-semibold ${styles.kbdOrBadgeClass}`}>
          {isCyberpunk ? ':: Task' : 'Task'}
        </span>
        {task.priority && (
          <span className={`font-mono text-[7.5px] uppercase tracking-wider rounded px-1.5 py-0.5 font-bold flex items-center gap-1 ${
            task.priority === 'high' 
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
              : task.priority === 'medium'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          }`}>
            <span>{task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}</span>
          </span>
        )}
      </div>

      <p className={`text-xs font-semibold leading-relaxed tracking-tight select-none pr-12 ${styles.textMainClass}`}>
        {task.title}
      </p>
      
      {task.description && (
        <p className={`text-[10.5px] mt-2 select-none leading-relaxed line-clamp-2 ${styles.textMutedClass}`}>
          {task.description}
        </p>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2.5 text-[9px] font-mono tracking-tight font-medium text-zinc-500">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} Subtasks</span>
        </div>
      )}

      {/* Render Tag Badges */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {task.tags.map((val) => (
            <span
              key={val}
              className="px-1.5 py-0.5 rounded text-[8px] uppercase font-mono tracking-tight font-bold border bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20"
            >
              #{val}
            </span>
          ))}
        </div>
      )}

      {/* Real-time Deadline / Alarm Bar */}
      {task.dueDate && (
        <div className={`mt-3 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[9px] border font-mono font-medium tracking-tight ${
          isGoalMet
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-555/20 dark:text-emerald-450'
            : isNear
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse font-bold'
              : isOverdue
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/25'
                : 'bg-zinc-500/5 text-zinc-500 border-zinc-500/10'
        }`}>
          {isGoalMet ? (
            <CheckCircle2 className="w-3 h-3 shrink-0" />
          ) : isNear ? (
            <AlertTriangle className="w-3 h-3 shrink-0" />
          ) : (
            <Clock className="w-3 h-3 shrink-0" />
          )}
          <span className="truncate">
            {isGoalMet ? 'Meta Atingida!' : isNear ? `URGENTE: ${timeLeft}` : isOverdue ? 'Expirada!' : `Restam ${timeLeft}`}
          </span>
        </div>
      )}

      {/* Render Avatar Overlaps */}
      {assignees.length > 0 && (
        <div className={`flex items-center justify-between border-t pt-2.5 mt-3 ${styles.borderClass}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
              {assignees.map((user, i) => (
                <div key={user.id} className="relative select-none" style={{ zIndex: assignees.length - i }}>
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.name || user.email}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover border border-zinc-250 dark:border-zinc-800 shrink-0"
                    />
                  ) : (
                    <div className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border shrink-0 ${getAvatarColor(user.id)}`}>
                      {(user.name ? user.name[0] : user.email[0]).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className={`text-[9.5px] font-mono truncate max-w-[130px] font-medium ${styles.textMutedClass}`}>
              {assignees.length === 1 
                ? (assignees[0].name || assignees[0].email.split('@')[0])
                : `${assignees.length} colaboradores`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
