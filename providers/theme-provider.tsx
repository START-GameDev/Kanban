'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'vercel' | 'supabase' | 'cyberpunk' | 'classic' | 'light';

export interface ThemeStyles {
  bgClass: string;
  cardBgClass: string;
  borderClass: string;
  inputBgClass: string;
  inputBorderClass: string;
  textMainClass: string;
  textMutedClass: string;
  headerBgClass: string;
  headerBorderClass: string;
  accentColorClass: string;
  accentBorderClass: string;
  accentBgClass: string;
  btnPrimaryClass: string;
  btnSecondaryClass: string;
  kbdOrBadgeClass: string;
  columnHeaderClass: string;
}

export const THEMES: Record<ThemeType, ThemeStyles> = {
  vercel: {
    bgClass: 'bg-[#000000]',
    cardBgClass: 'bg-[#0a0a0a]',
    borderClass: 'border-zinc-800',
    inputBgClass: 'bg-[#121212]',
    inputBorderClass: 'focus:border-zinc-600 border-zinc-850',
    textMainClass: 'text-zinc-100',
    textMutedClass: 'text-zinc-400',
    headerBgClass: 'bg-black/80',
    headerBorderClass: 'border-zinc-900',
    accentColorClass: 'text-zinc-100',
    accentBorderClass: 'border-zinc-700',
    accentBgClass: 'bg-zinc-900',
    btnPrimaryClass: 'bg-zinc-100 hover:bg-zinc-200 text-black font-semibold border border-transparent active:scale-97 cursor-pointer',
    btnSecondaryClass: 'bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 active:scale-97 cursor-pointer',
    kbdOrBadgeClass: 'bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono text-[9px] px-1.5 py-0.5',
    columnHeaderClass: 'text-zinc-300 uppercase font-semibold text-xs font-mono tracking-wider',
  },
  supabase: {
    bgClass: 'bg-[#0c0f16]',
    cardBgClass: 'bg-[#121723]',
    borderClass: 'border-[#1e293b]',
    inputBgClass: 'bg-[#1b2230]',
    inputBorderClass: 'focus:border-[#10b981] border-[#1e293b]',
    textMainClass: 'text-slate-100',
    textMutedClass: 'text-slate-400',
    headerBgClass: 'bg-[#0c0f16]/90',
    headerBorderClass: 'border-[#172033]',
    accentColorClass: 'text-[#10b981]',
    accentBorderClass: 'border-[#10b981]/20',
    accentBgClass: 'bg-[#10b981]/10',
    btnPrimaryClass: 'bg-[#10b981] hover:bg-[#059669] text-black font-semibold border border-transparent active:scale-97 cursor-pointer',
    btnSecondaryClass: 'bg-[#161e2e] hover:bg-[#1b2230] text-slate-300 border border-[#1e293b] active:scale-97 cursor-pointer',
    kbdOrBadgeClass: 'bg-emerald-950/20 text-[#10b981] border border-[#10b981]/20 font-mono text-[9px] px-1.5 py-0.5',
    columnHeaderClass: 'text-[#10b981] uppercase font-bold tracking-wide text-xs font-mono',
  },
  cyberpunk: {
    bgClass: 'bg-[#050505]',
    cardBgClass: 'bg-[#0b0b0e]',
    borderClass: 'border-amber-500/20',
    inputBgClass: 'bg-[#0f0f12]',
    inputBorderClass: 'focus:border-amber-500 border-amber-500/30',
    textMainClass: 'text-amber-100 font-mono',
    textMutedClass: 'text-amber-600/80 font-mono',
    headerBgClass: 'bg-black/90',
    headerBorderClass: 'border-amber-500/25',
    accentColorClass: 'text-amber-500 font-mono',
    accentBorderClass: 'border-amber-500/40',
    accentBgClass: 'bg-amber-500/5',
    btnPrimaryClass: 'bg-amber-500 hover:bg-amber-400 text-black font-bold border border-amber-600 font-mono active:scale-97 cursor-pointer',
    btnSecondaryClass: 'bg-black hover:bg-zinc-950 text-amber-500 border border-amber-500/30 font-mono active:scale-97 cursor-pointer',
    kbdOrBadgeClass: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono text-[9px] px-1.5 py-0.5',
    columnHeaderClass: 'text-amber-500 uppercase font-black tracking-widest text-xs font-mono',
  },
  classic: {
    bgClass: 'bg-[#030712]',
    cardBgClass: 'bg-[#0b0f19]',
    borderClass: 'border-indigo-950/50',
    inputBgClass: 'bg-[#0f172a]',
    inputBorderClass: 'focus:border-indigo-500 border-slate-800',
    textMainClass: 'text-slate-100',
    textMutedClass: 'text-slate-400',
    headerBgClass: 'bg-[#030712]/90',
    headerBorderClass: 'border-slate-900',
    accentColorClass: 'text-indigo-400',
    accentBorderClass: 'border-indigo-500/20',
    accentBgClass: 'bg-[#6366f1]/5',
    btnPrimaryClass: 'bg-indigo-600 hover:bg-indigo-500 text-white font-semibold border border-transparent active:scale-97 cursor-pointer',
    btnSecondaryClass: 'bg-[#0b0f19] hover:bg-slate-900/65 text-slate-300 border border-slate-800 active:scale-97 cursor-pointer',
    kbdOrBadgeClass: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 font-mono text-[9px] px-1.5 py-0.5',
    columnHeaderClass: 'text-slate-200 uppercase font-semibold text-xs tracking-wider',
  },
  light: {
    bgClass: 'bg-[#fcfcfc]',
    cardBgClass: 'bg-[#ffffff]',
    borderClass: 'border-zinc-200',
    inputBgClass: 'bg-[#f4f4f5]',
    inputBorderClass: 'focus:border-zinc-400 border-zinc-200 text-zinc-900',
    textMainClass: 'text-zinc-900',
    textMutedClass: 'text-zinc-500',
    headerBgClass: 'bg-white/80',
    headerBorderClass: 'border-zinc-200',
    accentColorClass: 'text-zinc-900',
    accentBorderClass: 'border-zinc-300',
    accentBgClass: 'bg-zinc-100',
    btnPrimaryClass: 'bg-zinc-900 hover:bg-zinc-850 text-white font-semibold border border-transparent active:scale-97 cursor-pointer',
    btnSecondaryClass: 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 active:scale-97 cursor-pointer',
    kbdOrBadgeClass: 'bg-zinc-100 text-zinc-650 border border-zinc-200 font-mono text-[9px] px-1.5 py-0.5',
    columnHeaderClass: 'text-zinc-800 uppercase font-semibold text-xs font-mono tracking-wider',
  },
};

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  styles: ThemeStyles;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'vercel',
  setTheme: () => {},
  styles: THEMES.vercel,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('vercel');

  useEffect(() => {
    const saved = localStorage.getItem('velox-theme') as ThemeType;
    if (saved && THEMES[saved]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(saved);
    }
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('velox-theme', newTheme);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const themeClasses: ThemeType[] = ['vercel', 'supabase', 'cyberpunk', 'classic', 'light'];
      themeClasses.forEach(t => root.classList.remove(t));
      root.classList.add(theme);
      root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    }
  }, [theme]);

  const styles = THEMES[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, styles }}>
      <div className={`contents ${theme}`}>{children}</div>
    </ThemeContext.Provider>
  );
}
