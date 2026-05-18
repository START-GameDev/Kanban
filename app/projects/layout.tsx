'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Velox Kanban</h1>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <div className="hidden sm:flex items-center space-x-3 text-sm font-medium text-slate-600">
            <span className="text-indigo-600 border-b-2 border-indigo-600 py-5">Projects</span>
          </div>
        </div>
        <div className="flex items-center gap-4 space-x-4">
          <span className="text-sm font-medium text-slate-600 hidden sm:inline-block">
            {user.displayName || user.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
}
