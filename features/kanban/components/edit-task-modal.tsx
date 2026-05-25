'use client';

import { useState, useEffect } from 'react';
import { Loader2, X, Check, Clock, Tag, Target, Users } from 'lucide-react';
import { MultiSearchableSelect } from '@/components/ui/multi-searchable-select';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    assigneeIds: string[];
    tags: string[];
    priority: string;
    timerType: 'none' | 'datetime' | 'duration';
    dueDate: string;
    durationValue: number;
    durationUnit: 'minutes' | 'hours';
    targetColumnId: string;
    subtasks: { id: string; title: string; description?: string; assigneeIds?: string[]; tags?: string[]; completed: boolean; }[];
    color: string;
  }) => void;
  task: any;
  members: any[];
  columns: any[];
  isSaving: boolean;
  theme: string;
  styles: any;
}

const colors = [
  'bg-emerald-500/15 text-emerald-600',
  'bg-rose-500/15 text-rose-600',
  'bg-sky-500/15 text-sky-600',
  'bg-amber-500/15 text-amber-600',
  'bg-violet-500/15 text-violet-600',
  'bg-fuchsia-500/15 text-fuchsia-600',
  'bg-teal-500/15 text-teal-600',
  'bg-orange-500/15 text-orange-600',
];

const TASK_COLORS = [
  { id: 'default', name: 'Padrão', lightClass: 'bg-zinc-100 border-zinc-300 text-zinc-800', darkClass: 'bg-zinc-900 border-zinc-800 text-zinc-300' },
  { id: 'red', name: 'Vermelho', lightClass: 'bg-rose-100 border-rose-300 text-rose-800', darkClass: 'bg-rose-950/40 border-rose-900 text-rose-300' },
  { id: 'blue', name: 'Azul', lightClass: 'bg-sky-100 border-sky-300 text-sky-850', darkClass: 'bg-sky-950/40 border-sky-900 text-sky-300' },
  { id: 'green', name: 'Verde', lightClass: 'bg-emerald-100 border-emerald-300 text-emerald-850', darkClass: 'bg-emerald-950/40 border-emerald-900 text-emerald-300' },
  { id: 'yellow', name: 'Amarelo', lightClass: 'bg-amber-100 border-amber-300 text-amber-850', darkClass: 'bg-amber-950/40 border-amber-900 text-amber-300' },
  { id: 'purple', name: 'Roxo', lightClass: 'bg-violet-100 border-violet-300 text-violet-850', darkClass: 'bg-violet-950/40 border-violet-900 text-violet-300' },
  { id: 'teal', name: 'Teal', lightClass: 'bg-teal-100 border-teal-300 text-teal-850', darkClass: 'bg-teal-950/40 border-teal-900 text-teal-300' },
];

const getAvatarColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < (userId || '').length; i++) {
    hash = (userId || '').charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function EditTaskModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  members,
  columns,
  isSaving,
  theme,
  styles,
}: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [color, setColor] = useState('default');

  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [timerType, setTimerType] = useState<'none' | 'datetime' | 'duration'>('none');
  const [dueDate, setDueDate] = useState('');
  const [durationValue, setDurationValue] = useState<number>(15);
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours'>('minutes');
  const [targetColumnId, setTargetColumnId] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; description?: string; assigneeIds?: string[]; tags?: string[]; completed: boolean; }[]>([]);

  const [showAssignees, setShowAssignees] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);

  useEffect(() => {
    if (task) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAssigneeIds(task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []));
      setTags(task.tags || []);
      setPriority(task.priority || 'medium');
      setColor(task.color || 'default');
      setTargetColumnId(task.targetColumnId || '');
      setSubtasks(task.subtasks || []);

      setShowAssignees((task.assigneeIds && task.assigneeIds.length > 0) || !!task.assigneeId);
      setShowTags(task.tags && task.tags.length > 0);
      setShowSubtasks(task.subtasks && task.subtasks.length > 0);
      
      if (task.dueDate) {
        setTimerType('datetime');
        setShowTimer(true);
        try {
          const dateObj = (task.dueDate as any).toDate ? (task.dueDate as any).toDate() : new Date(task.dueDate);
          const tzo = dateObj.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(dateObj.getTime() - tzo)).toISOString().slice(0, 16);
          setDueDate(localISOTime);
        } catch (e) {
          setDueDate('');
        }
      } else {
        setTimerType('none');
        setDueDate('');
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      assigneeIds,
      tags,
      priority,
      timerType,
      dueDate,
      durationValue,
      durationUnit,
      targetColumnId,
      subtasks,
      color,
    });
  };

  const memberOptions = members.map(m => ({
    value: m.id,
    label: m.name || m.email,
    sublabel: m.email,
    avatar: m.photoURL ? (
      <img src={m.photoURL} alt="" className="w-4 h-4 rounded-full" />
    ) : (
      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${getAvatarColor(m.id)}`}>
        {(m.name ? m.name[0] : m.email[0]).toUpperCase()}
      </div>
    ),
  }));

  const tagOptions = tags.map(t => ({ value: t, label: `#${t}` }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-xl shadow-xl relative overflow-visible flex flex-col border transition-all max-h-[92vh] ${styles.cardBgClass} ${styles.borderClass}`}>
        
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${styles.borderClass}`}>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 ${styles.accentColorClass}`} />
            <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
              Editar Task
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-500/10 text-zinc-500 hover:text-zinc-150 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - scrollable */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-5 flex flex-col gap-4 max-h-[75vh]">
          {/* Título e Prioridade Container */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Título *</label>
              <input
                required
                type="text"
                placeholder="Defina o título da sua task..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={`w-full text-xs rounded-md px-3.5 py-2 placeholder:text-zinc-500 outline-none transition-all border ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
              />
            </div>
            
            {/* Prioridade */}
            <div className="flex flex-col gap-1.5 w-32 shrink-0">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Prioridade</label>
              <SearchableSelect
                options={[
                  { value: 'low', label: 'Baixa 🟢' },
                  { value: 'medium', label: 'Média 🟡' },
                  { value: 'high', label: 'Alta 🔴' }
                ]}
                value={priority}
                onChange={setPriority}
                placeholder="Selecionar prioridade"
                searchPlaceholder="Definir..."
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Descrição (Opcional)</label>
            <textarea
              placeholder="Adicione detalhes ou requisitos da task..."
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`w-full text-xs rounded-md px-3.5 py-2 placeholder:text-zinc-500 outline-none transition-all resize-none border ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
            />
          </div>

          {/* Cor do Card */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Cor do Card</label>
            <div className="flex items-center gap-2 flex-wrap">
              {TASK_COLORS.map((tc) => (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => setColor(tc.id)}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-150 relative cursor-pointer ${
                    theme === 'light' ? tc.lightClass : tc.darkClass
                  } ${
                    color === tc.id 
                      ? 'scale-110 ring-2 ring-zinc-400 border-white dark:border-black' 
                      : 'hover:scale-105 border-transparent'
                  }`}
                  title={tc.name}
                >
                  {color === tc.id && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-800 dark:text-zinc-200">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar de Funcionalidades Extras */}
          <div className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => setShowAssignees(!showAssignees)}
              className={`p-2 border rounded-md transition-all font-mono text-[10px] tracking-wider uppercase flex items-center gap-1.5 ${showAssignees ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700' : 'bg-transparent text-zinc-500 border-dashed border-zinc-700 hover:text-zinc-300'}`}
              title="Adicionar Responsáveis"
            >
              <Users className="w-3.5 h-3.5" /> Responsáveis
            </button>
            <button
              type="button"
              onClick={() => setShowTags(!showTags)}
              className={`p-2 border rounded-md transition-all font-mono text-[10px] tracking-wider uppercase flex items-center gap-1.5 ${showTags ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700' : 'bg-transparent text-zinc-500 border-dashed border-zinc-700 hover:text-zinc-300'}`}
              title="Adicionar Tags"
            >
              <Tag className="w-3.5 h-3.5" /> Tags
            </button>
            <button
              type="button"
              onClick={() => setShowTimer(!showTimer)}
              className={`p-2 border rounded-md transition-all font-mono text-[10px] tracking-wider uppercase flex items-center gap-1.5 ${showTimer ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700' : 'bg-transparent text-zinc-500 border-dashed border-zinc-700 hover:text-zinc-300'}`}
              title="Configurar Alarme / Prazo"
            >
              <Clock className="w-3.5 h-3.5" /> Timer / Prazo
            </button>
             <button
              type="button"
              onClick={() => setShowSubtasks(!showSubtasks)}
               className={`p-2 border rounded-md transition-all font-mono text-[10px] tracking-wider uppercase flex items-center gap-1.5 ${showSubtasks ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700' : 'bg-transparent text-zinc-500 border-dashed border-zinc-700 hover:text-zinc-300'}`}
              title="Adicionar Subtasks"
            >
              <Check className="w-3.5 h-3.5" /> Subtasks
            </button>
          </div>

          {/* Atribuir Responsáveis (Opcional) */}
          {showAssignees && (
            <div className="flex flex-col gap-1.5 overflow-visible animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1">
                <Users className="w-3 h-3" /> Responsáveis (Múltiplos)
              </label>
              <MultiSearchableSelect
                options={memberOptions}
                value={assigneeIds}
                onChange={setAssigneeIds}
                placeholder="Atribuir a pessoas..."
                searchPlaceholder="Pesquisar membros do projeto..."
              />
            </div>
          )}

          {/* Tags (Opcional) */}
          {showTags && (
            <div className="flex flex-col gap-1.5 overflow-visible animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags / Categorias
              </label>
              <MultiSearchableSelect
                options={tagOptions}
                value={tags}
                onChange={setTags}
                allowCreation
                placeholder="Escreva e tecle enter para criar..."
                searchPlaceholder="Tags..."
              />
            </div>
          )}

          {/* Timer Setup (Opcional) */}
          {showTimer && (
            <div className={`p-3.5 rounded-lg border flex flex-col gap-3 bg-zinc-500/5 ${styles.borderClass} animate-in fade-in slide-in-from-top-2`}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Configurar Alarme / Prazo (Timer)
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTimerType('none')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${
                    timerType === 'none'
                      ? 'border-emerald-555/50 bg-emerald-500/10 text-emerald-400 font-extrabold'
                      : 'border-zinc-800 text-zinc-500 bg-transparent hover:text-zinc-300'
                  }`}
                >
                  Sem Alarme
                </button>
                <button
                  type="button"
                  onClick={() => setTimerType('datetime')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${
                    timerType === 'datetime'
                      ? 'border-emerald-555/50 bg-emerald-500/10 text-emerald-400 font-extrabold'
                      : 'border-zinc-800 text-zinc-500 bg-transparent hover:text-zinc-300'
                  }`}
                >
                  Data/Hora Fixo
                </button>
                <button
                  type="button"
                  onClick={() => setTimerType('duration')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${
                    timerType === 'duration'
                      ? 'border-emerald-555/50 bg-emerald-500/10 text-emerald-400 font-extrabold'
                      : 'border-zinc-800 text-zinc-500 bg-transparent hover:text-zinc-300'
                  }`}
                >
                  Novo Prazo
                </button>
              </div>

              {timerType === 'datetime' && (
                <div className="flex flex-col gap-1 animate-in slide-in-from-top-1 duration-100">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Selecionar Data e Hora</span>
                  <input
                    type="datetime-local"
                    required={(timerType as string) === 'datetime'}
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={`w-full text-xs rounded-md px-3 py-1.5 outline-none transition-all border ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
                  />
                </div>
              )}

              {timerType === 'duration' && (
                <div className="flex gap-2 items-center animate-in slide-in-from-top-1 duration-100">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Duração (+X)</span>
                    <input
                      type="number"
                      min={1}
                      required={(timerType as string) === 'duration'}
                      value={durationValue}
                      onChange={e => setDurationValue(Number(e.target.value))}
                      className={`w-full text-xs rounded-md px-3 py-1.5 outline-none transition-all border ${styles.inputBgClass} ${styles.borderClass} ${styles.inputBorderClass}`}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Unidade</span>
                    <select
                      value={durationUnit}
                      onChange={e => setDurationUnit(e.target.value as 'minutes' | 'hours')}
                      className={`w-full h-[30px] text-xs px-2 rounded-md border text-zinc-300 ${styles.inputBgClass} ${styles.borderClass} outline-none cursor-pointer`}
                    >
                      <option value="minutes" className="bg-zinc-950">Minutos</option>
                      <option value="hours" className="bg-zinc-950">Horas</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Target Column (Only if timer is active) */}
              {timerType !== 'none' && (
                <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-zinc-800">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1">
                    <Target className="w-3 h-3 text-emerald-500" /> Coluna Objetivo
                  </label>
                  <SearchableSelect
                    options={[
                      { value: '', label: 'Nenhum objetivo (desativado)' },
                      ...columns.map(c => ({ value: c.id, label: c.name }))
                    ]}
                    value={targetColumnId}
                    onChange={setTargetColumnId}
                    placeholder="Meta de Coluna"
                    searchPlaceholder="Filtrar colunas..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Subtasks */}
          {showSubtasks && (
            <div className={`p-3.5 rounded-lg border flex flex-col gap-3 bg-zinc-500/5 ${styles.borderClass} animate-in fade-in slide-in-from-top-2`}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5 justify-between">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Subtasks
                </div>
                <button
                  type="button"
                  className="px-2 py-1 text-[9px] rounded bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 transition-colors"
                  onClick={() => {
                    setSubtasks([...subtasks, { id: crypto.randomUUID(), title: '', completed: false }]);
                  }}
                >
                  + ADD SUBTASK
                </button>
              </label>

              {subtasks.length === 0 && (
                 <p className="text-[10px] italic text-zinc-500 text-center py-2 font-mono">Nenhuma subtask adicionada. Clique em + ADD SUBTASK.</p>
              )}

              <div className="flex flex-col gap-2">
                {subtasks.map((st, idx) => (
                  <div key={st.id} className="flex flex-col gap-2 p-3 border border-zinc-700/50 bg-zinc-900/40 rounded-md">
                    <div className="flex gap-2">
                       <input
                        type="text"
                        placeholder="Título da Subtask *"
                        required
                        value={st.title}
                        onChange={(e) => {
                          const newSt = [...subtasks];
                          newSt[idx].title = e.target.value;
                          setSubtasks(newSt);
                        }}
                        className={`flex-1 text-xs rounded px-2.5 py-1.5 font-bold border ${styles.inputBgClass} ${styles.borderClass} outline-none placeholder:text-zinc-600`}
                       />
                       <button
                         type="button"
                         onClick={() => {
                            const newSt = [...subtasks];
                            newSt.splice(idx, 1);
                            setSubtasks(newSt);
                         }}
                         className="p-1.5 text-zinc-500 hover:text-rose-400 border border-transparent hover:border-rose-900/50 rounded hover:bg-rose-950/20 transition-all font-mono"
                       >
                         <X className="w-3.5 h-3.5" />
                       </button>
                    </div>
                    
                    <textarea 
                      placeholder="Descrição da subtask (Opcional)..."
                      className={`w-full text-xs rounded px-2.5 py-1.5 border resize-none ${styles.inputBgClass} ${styles.borderClass} outline-none placeholder:text-zinc-600`}
                      rows={1}
                      value={st.description || ''}
                      onChange={(e) => {
                        const newSt = [...subtasks];
                        newSt[idx].description = e.target.value;
                        setSubtasks(newSt);
                      }}
                    />

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Responsáveis</span>
                        <MultiSearchableSelect
                          options={memberOptions}
                          value={st.assigneeIds || []}
                          onChange={(ids) => {
                            const newSt = [...subtasks];
                            newSt[idx].assigneeIds = ids;
                            setSubtasks(newSt);
                          }}
                          placeholder="Pessoas..."
                          searchPlaceholder="Membros..."
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Tags</span>
                        <MultiSearchableSelect
                          options={tagOptions}
                          value={st.tags || []}
                          onChange={(newTags) => {
                            const newSt = [...subtasks];
                            newSt[idx].tags = newTags;
                            setSubtasks(newSt);
                          }}
                          allowCreation
                          placeholder="Tags..."
                          searchPlaceholder="Buscar..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={`pt-4 border-t flex justify-end gap-2.5 mt-2 ${styles.borderClass}`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`h-8.5 px-5 text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 cursor-pointer ${styles.btnPrimaryClass}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
