'use client';

import { useAuth } from '@/providers/auth-provider';
import { LoginButton } from '@/features/auth/components/login-button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, KanbanSquare, Sparkles, Zap, Shield, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/projects');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 font-sans text-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#000000] font-sans text-zinc-100 selection:bg-zinc-800 selection:text-white overflow-x-hidden relative">
      {/* Subtle Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f0a_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between border-b border-zinc-900 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <KanbanSquare className="w-4.5 h-4.5 text-black" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white font-mono">
            nexion.sh
          </span>
        </div>
        <div className="hidden sm:flex items-center space-x-1.5 text-[10px] uppercase font-semibold font-mono px-2.5 py-1 bg-zinc-950 border border-zinc-900 rounded-md text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sincronização Ativa</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-28 flex flex-col items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-950 border border-zinc-900 text-zinc-400 text-xs font-mono font-medium mb-8">
            <Zap className="w-3.5 h-3.5 text-zinc-500 fill-zinc-500" />
            <span>Colaboração instantânea e gratuita</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-white mb-6 leading-tight">
            Gerencie suas demandas <br className="hidden sm:inline" />
            <span className="text-zinc-500">com fluxo ultra rápido.</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mb-12 leading-relaxed font-normal">
            Crie quadros, organize colunas e distribua tarefas com um kanban veloz, minimalista e persistente projetado para desenvolvedores e equipes de produto.
          </p>

          {/* Call to action & Onboarding card */}
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-900 rounded-lg p-8 shadow-xl relative">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-zinc-200 mb-1">Comece a produzir</h3>
              <p className="text-xs text-zinc-500 text-center mb-6 font-mono">Acesse sua conta do Google com um clique</p>
              <LoginButton />
            </div>
          </div>
        </motion.div>

        {/* Live Interactive Board Mock Element */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-4xl mt-20 p-px bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="bg-black p-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 px-1">
              <div className="flex items-center gap-1.5 ">
                <div className="w-2 h-2 rounded-full bg-zinc-850" />
                <div className="w-2 h-2 rounded-full bg-zinc-850" />
                <div className="w-2 h-2 rounded-full bg-zinc-850" />
                <span className="text-[10px] text-zinc-500 font-mono ml-3">board_preview.json</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-12 h-1 bg-zinc-900 rounded" />
                <div className="w-8 h-1 bg-zinc-900 rounded" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-16 opacity-90 select-none">
              {/* Column 1 */}
              <div className="bg-black border border-zinc-900 rounded-lg p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Pilha de Tarefas</span>
                  <span className="text-[9px] bg-zinc-900 text-zinc-500 font-mono px-1.5 py-0.5 rounded border border-zinc-800">3</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-md flex flex-col gap-1.5">
                  <div className="text-xs font-medium text-zinc-200">Revisar fluxos de onboarding</div>
                  <div className="text-[10px] text-zinc-500 font-sans">Mapear telas com os novos fluxos de cadastro</div>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-md flex flex-col gap-1.5 opacity-60">
                  <div className="text-xs font-medium text-zinc-200">Otimizar imagens do blog</div>
                  <div className="text-[10px] text-zinc-500 font-sans">Melhorar carregamento via Next/Image</div>
                </div>
              </div>

              {/* Column 2 */}
              <div className="bg-black border border-zinc-900 rounded-lg p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300">Em Progresso</span>
                  <span className="text-[9px] bg-zinc-900 text-zinc-400 font-mono px-1.5 py-0.5 rounded border border-zinc-800">1</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-md flex flex-col gap-1.5 relative border-l-border-white">
                  <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-white" />
                  <div className="text-xs font-medium text-zinc-200">Implementar Drag & Drop</div>
                  <div className="text-[10px] text-zinc-400 font-sans">Arraste intuitivo utilizando biblioteca do dnd-kit</div>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="text-[9px] bg-zinc-800 text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded font-mono">core_02</span>
                  </div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="bg-black border border-zinc-900 rounded-lg p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500">Concluído</span>
                  <span className="text-[9px] bg-emerald-950/20 text-emerald-500 border border-emerald-950/50 font-mono px-1.5 py-0.5 rounded">2</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-md flex flex-col gap-1.5">
                  <div className="text-xs font-medium text-zinc-400 line-through">Integrar Firebase Auth</div>
                  <div className="text-[10px] text-zinc-600 line-through font-sans">Suporte completo ao login com Google</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mt-24 border-t border-zinc-900 pt-16">
          <div className="flex flex-col gap-3">
            <div className="w-8 h-8 bg-zinc-950 border border-zinc-900 rounded-md flex items-center justify-center text-zinc-400">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="font-medium text-xs font-mono uppercase tracking-wider text-zinc-200">Segurança de dados</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">Políticas e regras de segurança rígidas e autorizativas protegendo os dados de todas as colunas do seu time.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-8 h-8 bg-zinc-950 border border-zinc-900 rounded-md flex items-center justify-center text-zinc-400">
              <Share2 className="w-4 h-4" />
            </div>
            <h4 className="font-medium text-xs font-mono uppercase tracking-wider text-zinc-200">Colaboração real</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">Adicione usuários cadastrados no ecossistema ao seu projeto para atribuir cargos e responsabilidades completas.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-8 h-8 bg-zinc-950 border border-zinc-900 rounded-md flex items-center justify-center text-zinc-400">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="font-medium text-xs font-mono uppercase tracking-wider text-zinc-200">Tempo real ativo</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">Desenvolvimento sem lentidão ou necessidade de recarregar a página. Atualização instantânea via conexões seguras.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

