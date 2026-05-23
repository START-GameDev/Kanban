'use client';

import { useAuth } from '@/providers/auth-provider';
import { useTheme, ThemeType } from '@/providers/theme-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, LogOut, KanbanSquare, Sparkles, Settings, Palette, Check, X, Laptop } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { theme, setTheme, styles } = useTheme();
  const router = useRouter();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#000000]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  const handleLogout = () => {
    auth.signOut();
  };

  const userInitials = user.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user.email ? user.email[0].toUpperCase() : 'U');

  const availableThemes: { id: ThemeType; name: string; desc: string; previewBg: string; accentBg: string }[] = [
    {
      id: 'vercel',
      name: 'Vercel Obsidian',
      desc: 'Monocromático, minimalista e de altíssimo contraste.',
      previewBg: 'bg-black border-zinc-800',
      accentBg: 'bg-white',
    },
    {
      id: 'supabase',
      name: 'Supabase Emerald',
      desc: 'Base verde-escura profunda com sotaques esmeralda.',
      previewBg: 'bg-[#0c0f16] border-[#1e293b]',
      accentBg: 'bg-[#10b981]',
    },
    {
      id: 'cyberpunk',
      name: 'Neon Cyberpunk',
      desc: 'Base puro carvão com emissores amber retrô e tipologia mono.',
      previewBg: 'bg-[#050505] border-amber-500/20',
      accentBg: 'bg-amber-500',
    },
    {
      id: 'classic',
      name: 'Slate Classic',
      desc: 'O consagrado tom azul-marinho refinado com ícones indigo.',
      previewBg: 'bg-[#030712] border-slate-900',
      accentBg: 'bg-indigo-500',
    },
    {
      id: 'light',
      name: 'Light Minimal',
      desc: 'Visual totalmente claro, limpo, moderno e de altíssimo contraste.',
      previewBg: 'bg-white border-zinc-200',
      accentBg: 'bg-zinc-900',
    },
  ];

  return (
    <div className={`h-screen flex flex-col font-sans transition-colors duration-200 overflow-hidden relative ${styles.bgClass} ${styles.textMainClass}`}>
      {/* Dynamic Ambient Background Accents */}
      {theme === 'classic' && (
        <>
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        </>
      )}
      {theme === 'supabase' && (
        <>
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      <header className={`h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-20 relative border-b transition-colors duration-200 ${styles.headerBgClass} ${styles.headerBorderClass} backdrop-blur-md`}>
        <div className="flex items-center space-x-6">
          <Link href="/projects" className="flex items-center space-x-2.5 group transition-all active:scale-95 cursor-pointer">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-black border border-transparent transition-all shadow-sm cursor-pointer ${
              theme === 'supabase' ? 'bg-[#10b981]' : 
              theme === 'cyberpunk' ? 'bg-amber-500' : 
              theme === 'classic' ? 'bg-indigo-500 text-white' : 
              theme === 'light' ? 'bg-zinc-900 text-white' : 'bg-white'
            }`}>
              <KanbanSquare className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight uppercase font-mono hover:opacity-80 transition-opacity cursor-pointer">
              nexion.board
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "Avatar"} 
                className={`w-8 h-8 rounded-full object-cover border ${styles.accentBorderClass}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center border ${styles.accentBgClass} ${styles.accentBorderClass} ${styles.accentColorClass}`}>
                {userInitials}
              </div>
            )}
            <span className={`text-xs font-medium hidden sm:inline-block max-w-[120px] truncate ${styles.textMutedClass}`}>
              {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
            </span>
          </div>

          <div className={`h-4 w-px hidden sm:block ${styles.borderClass}`}></div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsConfigOpen(true)}
            className={`rounded-md h-8 px-2.5 border transition-all cursor-pointer ${styles.borderClass} ${styles.btnSecondaryClass}`}
          >
            <Settings className="h-3.5 w-3.5 mr-1.5 cursor-pointer" />
            <span className="text-[10px] font-bold uppercase tracking-wider cursor-pointer">Aparência</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className={`rounded-md h-8 px-2.5 text-zinc-400 hover:text-rose-450 hover:bg-rose-500/10 transition-colors border border-transparent cursor-pointer`}
          >
            <LogOut className="h-3.5 w-3.5 cursor-pointer" />
            <span className="hidden sm:inline ml-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer">Sair</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden z-10 relative">
        {children}
      </main>

      {/* Modern High-End Config Backdrop / Dialog */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-in fade-in duration-150">
          <div 
            className={`w-full max-w-lg rounded-lg border p-6 flex flex-col gap-6 shadow-2xl relative ${styles.cardBgClass} ${styles.borderClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsConfigOpen(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-md hover:bg-zinc-850 text-zinc-500 hover:text-zinc-200 transition-colors border border-transparent hover:${styles.borderClass} cursor-pointer`}
            >
              <X className="w-4 h-4 cursor-pointer" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Palette className={`w-4 h-4 ${styles.accentColorClass}`} />
                <h3 className={`text-sm font-semibold uppercase tracking-wider font-mono ${theme === 'light' ? 'text-zinc-900 font-bold' : 'text-zinc-100'}`}>Personalizar Área de Trabalho</h3>
              </div>
              <p className={`text-xs leading-relaxed ${styles.textMutedClass}`}>
                Escolha o tema visual que melhor se adapta ao fluxo de desenvolvimento do seu time. A escolha é salva localmente.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1">
              {availableThemes.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected 
                        ? `bg-zinc-950/45 ${styles.borderClass}` 
                        : 'border-zinc-900/40 hover:border-zinc-550/40 bg-black/5 hover:bg-black/15'
                    }`}
                  >
                    <div className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-10 h-10 rounded-md border flex items-center justify-center relative flex-shrink-0 cursor-pointer ${t.previewBg}`}>
                        <div className={`w-3.5 h-3.5 rounded-full cursor-pointer ${t.accentBg}`} />
                      </div>
                      <div className="cursor-pointer">
                        <div className={`text-xs font-semibold flex items-center gap-2 cursor-pointer ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-150'}`}>
                          {t.name}
                          {isSelected && (
                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-normal ${theme === 'light' ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-900 text-zinc-400'}`}>Ativo</span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-[280px] leading-relaxed cursor-pointer">
                          {t.desc}
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                      isSelected 
                        ? (theme === 'light' ? 'bg-zinc-950 border-zinc-950 text-white' : 'bg-white border-white text-black')
                        : 'border-zinc-800'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3] cursor-pointer" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={`pt-4 border-t flex items-center justify-between ${styles.borderClass}`}>
              <span className="text-[10px] text-zinc-500 font-mono">Interface v1.5.0 • Local Host State</span>
              <Button 
                onClick={() => setIsConfigOpen(false)}
                className={`py-1.5 px-4 text-xs font-semibold cursor-pointer ${styles.btnPrimaryClass}`}
              >
                Concluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
