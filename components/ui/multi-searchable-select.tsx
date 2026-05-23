'use client';

import * as React from 'react';
import { Search, Check, ChevronDown, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';

export interface MultiSearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  avatar?: React.ReactNode;
}

interface MultiSearchableSelectProps {
  options: MultiSearchableSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
  allowCreation?: boolean;
  onCreateOption?: (value: string) => void;
}

export function MultiSearchableSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Selecionar...',
  searchPlaceholder = 'Pesquisar...',
  emptyMessage = 'Nenhum resultado encontrado.',
  className,
  align = 'left',
  disabled = false,
  allowCreation = false,
  onCreateOption,
}: MultiSearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const { theme } = useTheme();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus search input when details open
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Handle click outside dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = React.useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(searchLower))
    );
  }, [options, search]);

  const handleToggleOption = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((item) => item !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const handleRemoveOne = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(value.filter((item) => item !== val));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSearch = search.trim();
    if (!cleanSearch) return;

    // Check if it already exists in options
    const exists = options.some(opt => opt.value.toLowerCase() === cleanSearch.toLowerCase());
    if (exists) return;

    if (onCreateOption) {
      onCreateOption(cleanSearch);
      // Automatically select it
      onChange([...value, cleanSearch]);
      setSearch('');
    }
  };

  const showCreateOption = allowCreation && search.trim() && !options.some(
    opt => opt.value.toLowerCase() === search.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className={cn('relative w-full text-xs font-mono', className)}>
      {/* Trigger Area with selected options displayed as inline badges */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-1.5 min-h-9 rounded-md border outline-none text-left transition-all duration-150 cursor-pointer text-xs disabled:opacity-50 disabled:pointer-events-none',
          theme === 'light'
            ? 'bg-white border-zinc-200 text-zinc-850 hover:border-zinc-350 hover:bg-zinc-50/50'
            : 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900/50',
          isOpen && (theme === 'light' ? 'border-zinc-400 ring-2 ring-zinc-100' : 'border-zinc-600 ring-2 ring-zinc-800/50'),
          disabled && 'opacity-55 cursor-not-allowed pointer-events-none'
        )}
      >
        <div className="flex flex-wrap gap-1.5 items-center mr-2 py-0.5">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border font-mono tracking-tight transition-all uppercase',
                  theme === 'light'
                    ? 'bg-zinc-100 border-zinc-250 text-zinc-800'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-250'
                )}
              >
                {opt.avatar && <span className="mr-0.5 text-xs inline-block shrink-0">{opt.avatar}</span>}
                <span className="truncate max-w-[80px]">{opt.label}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveOne(e, opt.value)}
                  className="hover:bg-black/10 dark:hover:bg-white/10 p-0.5 rounded transition-all cursor-pointer"
                >
                  <X className="w-2.5 h-2.5 text-zinc-500 hover:text-zinc-350" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-zinc-500 font-mono italic select-none py-1">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 shrink-0 ml-auto', isOpen && 'rotate-180')} />
      </div>

      {/* Floating List Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full rounded-lg border shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col',
            theme === 'light'
              ? 'bg-white/95 border-zinc-200 text-zinc-800'
              : 'bg-zinc-950/95 border-zinc-800 text-zinc-100',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {/* Search/Create bar */}
          <form onSubmit={handleCreate} className={cn('p-2 border-b flex items-center gap-1.5 shrink-0', theme === 'light' ? 'border-zinc-100' : 'border-zinc-900')}>
            <Search className="w-3.5 h-3.5 text-zinc-500 ml-1 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs py-1 outline-none font-mono placeholder:text-zinc-500 border-none focus:ring-0 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </form>

          {/* Options list container */}
          <div className="max-h-[180px] overflow-y-auto p-1 py-1.5 space-y-0.5">
            {filteredOptions.length === 0 && !showCreateOption ? (
              <div className="text-center py-4 px-3">
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{emptyMessage}</p>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggleOption(opt.value)}
                    className={cn(
                      'w-full flex items-center justify-between text-left p-2 rounded-md transition-all duration-120 group cursor-pointer text-xs',
                      theme === 'light'
                        ? isSelected
                          ? 'bg-zinc-100 text-zinc-900 font-semibold'
                          : 'hover:bg-zinc-50 text-zinc-750 hover:text-zinc-900'
                        : isSelected
                          ? 'bg-zinc-900 text-zinc-50 font-semibold'
                          : 'hover:bg-zinc-900/60 text-zinc-350 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div className={cn(
                        'w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] shrink-0',
                        theme === 'light'
                          ? isSelected ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-zinc-300'
                          : isSelected ? 'bg-zinc-100 border-zinc-100 text-black' : 'border-zinc-800'
                      )}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                      </div>
                      {opt.avatar && <div className="shrink-0">{opt.avatar}</div>}
                      <div className="flex flex-col truncate">
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className={cn('text-[9.5px] font-mono truncate', isSelected ? 'text-zinc-400' : 'text-zinc-500')}>
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}

            {showCreateOption && (
              <button
                type="button"
                onClick={handleCreate}
                className={cn(
                  'w-full flex items-center gap-2 text-left p-2 rounded-md transition-all duration-120 border border-dashed cursor-pointer text-xs',
                  theme === 'light'
                    ? 'border-zinc-250 hover:bg-zinc-50 text-zinc-800 font-medium'
                    : 'border-zinc-850 hover:bg-zinc-900/60 text-zinc-300 font-medium'
                )}
              >
                <Plus className="w-3.5 h-3.5 text-zinc-500" />
                <span>Criar nova tag: <strong className="font-bold underline">{search.trim()}</strong></span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
