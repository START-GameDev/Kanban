'use client';

import { Task } from '../schemas/kanban';
import { kanbanService } from '../services/kanban.service';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Pencil } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

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

  const assignee = members.find(m => m.id === task.assigneeId);

  const handleDeleteTask = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteClick) {
      onDeleteClick();
    }
  };

  const isVercel = theme === 'vercel';
  const isCyberpunk = theme === 'cyberpunk';

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
        // Prevent click if clicking direct buttons
        if ((e.target as HTMLElement).closest('button')) return;
        if (onCardClick) {
          onCardClick();
        }
      }}
      className={`p-4 border rounded-md hover:shadow-sm duration-150 transition-all select-none relative group ${styles.cardBgClass} ${styles.borderClass} ${
        isReadOnly ? 'cursor-default hover:border-zinc-300 dark:hover:border-zinc-750' : 'cursor-grab active:cursor-grabbing hover:border-zinc-400 dark:hover:border-zinc-650'
      } ${
        isDragging ? 'opacity-25 border-dashed bg-black/50' : 'opacity-100'
      }`}
    >
      {!isReadOnly && (
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-150">
          <button
            type="button"
            onPointerDown={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onEditClick) {
                onEditClick();
              }
            }}
            className={`p-1.5 rounded-md text-zinc-500 hover:text-zinc-150 hover:bg-zinc-500/10 border border-transparent transition-all cursor-pointer`}
            title="Editar tarefa"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            onPointerDown={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={handleDeleteTask}
            className={`p-1.5 rounded-md text-zinc-500 hover:text-rose-450 hover:bg-rose-500/10 border border-transparent transition-all cursor-pointer`}
            title="Excluir tarefa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-2.5">
        <span className={`font-mono text-[8px] uppercase tracking-wider rounded font-semibold ${styles.kbdOrBadgeClass}`}>
          {isCyberpunk ? ':: Task' : 'Task'}
        </span>
      </div>

      <p className={`text-xs font-semibold leading-relaxed tracking-tight select-none pr-12 ${styles.textMainClass}`}>
        {task.title}
      </p>
      
      {task.description && (
        <p className={`text-[10.5px] mt-2 select-none leading-relaxed line-clamp-2 ${styles.textMutedClass}`}>
          {task.description}
        </p>
      )}

      {assignee && (
        <div className={`flex items-center justify-between border-t pt-2.5 mt-3 ${styles.borderClass}`}>
          <div className="flex items-center gap-1.5">
            {assignee.photoURL ? (
              <img 
                src={assignee.photoURL} 
                alt={assignee.name || assignee.email}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
              />
            ) : (
              <div className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border ${getAvatarColor(assignee.id)}`} title={assignee.email}>
                {(assignee.name ? assignee.name[0] : assignee.email[0]).toUpperCase()}
              </div>
            )}
            <span className={`text-[9.5px] font-mono truncate max-w-[130px] font-medium ${styles.textMutedClass}`}>
              {assignee.name || assignee.email.split('@')[0]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
