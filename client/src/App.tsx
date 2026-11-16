import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { AuthScreen } from './features/authentication/AuthScreen';
import { AppLayout } from './layouts/AppLayout';
import { ToastProvider } from './components/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isInitialized, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!isInitialized || isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-[#212121] text-zinc-900 dark:text-white select-none transition-colors duration-200">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          {/* Telegram Web A Style Circular Spinner */}
          <div className="w-12 h-12 rounded-full border-[3px] border-[#3390EC]/20 dark:border-[#8774E1]/20 border-t-[#3390EC] dark:border-t-[#8774E1] animate-spin" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-800 dark:text-white/90">
            BecuGram
          </h1>
          <p className="text-xs text-[#707579] dark:text-[#AAAAAA] font-medium">
            Yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AppLayout /> : <AuthScreen />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
