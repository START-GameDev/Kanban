'use client';

import { useState } from 'react';
import { auth, GoogleAuthProvider, signInWithPopup } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';

export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login failed:", err);
      // Ignore pop-up closed errors
      if (err.code !== 'auth/popup-closed-by-user') {
        setError("Erro ao autenticar com Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        onClick={handleLogin} 
        disabled={isLoading}
        className="w-full sm:w-auto min-w-[200px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <LogIn className="mr-2 h-5 w-5" />
        )}
        Entrar com Google
      </Button>
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
}
