import type {Metadata} from 'next';
import './globals.css'; // Global styles

import { AuthProvider } from '@/providers/auth-provider';

export const metadata: Metadata = {
  title: 'Velox Kanban',
  description: 'Sistema de Kanban Real-time e Multi-usuário',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
