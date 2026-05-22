'use client';

import * as React from 'react';
import { Search, Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  avatar?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  searchPlaceholder = 'Pesquisar...',
  emptyMessage = 'Nenhum resultado encontrado.',
  className,
  align = 'left',
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const { styles, theme } = useTheme();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Click outside detection
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.value === value);
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

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full text-xs font-mono', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2 rounded-md border outline-none text-left transition-all duration-150 cursor-pointer text-xs disabled:opacity-50 disabled:pointer-events-none',
          theme === 'light'
            ? 'bg-white border-zinc-200 text-zinc-850 hover:border-zinc-350 hover:bg-zinc-50/50'
            : 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900/50',
          isOpen && (theme === 'light' ? 'border-zinc-400 ring-2 ring-zinc-100' : 'border-zinc-600 ring-2 ring-zinc-800/50')
        )}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {selectedOption ? (
            <>
              {selectedOption.avatar && <div className="shrink-0">{selectedOption.avatar}</div>}
              <div className="flex flex-col truncate">
                <span className={cn("font-medium select-none truncate", theme === 'light' ? 'text-zinc-800' : 'text-zinc-150')}>
                  {selectedOption.label}
                </span>
                {selectedOption.sublabel && (
                  <span className="text-[9.5px] text-zinc-500 font-mono truncate">
                    {selectedOption.sublabel}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-zinc-500 font-mono italic select-none">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 shrink-0', isOpen && 'rotate-180')} />
      </button>

      {/* Floating Dropdown Panel */}
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
          {/* Search bar input section */}
          <div className={cn('p-2 border-b flex items-center gap-1.5 shrink-0', theme === 'light' ? 'border-zinc-100' : 'border-zinc-900')}>
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
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options scrollable list */}
          <div className="max-h-[180px] overflow-y-auto p-1 py-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-4 px-3">
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{emptyMessage}</p>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
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
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
