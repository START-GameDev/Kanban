'use client';

import { useAuth } from '@/providers/auth-provider';
import { LoginButton } from '@/features/auth/components/login-button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 font-sans text-slate-900 p-4">
      <div className="mx-auto w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 px-8 py-10 shadow-sm text-center flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-4">V</div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Velox Kanban</h1>
        <p className="mb-8 text-sm text-slate-500">Faça login para gerenciar seus projetos.</p>
        <LoginButton />
      </div>
    </div>
  );
}
