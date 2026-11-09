import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { AuthScreen } from './features/authentication/AuthScreen';
import { AppLayout } from './layouts/AppLayout';
import { ToastProvider } from './components/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BecuLogo } from './components/BecuLogo';

const queryClient = new QueryClient();

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isInitialized, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!isInitialized || isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0B1311] text-white">
        <div className="animate-pulse-subtle mb-4">
          <BecuLogo size={56} />
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-1">BecuGram</h1>
        <p className="text-xs text-[#8DA39A] uppercase tracking-wider font-semibold">
          Connect. Communicate. Belong.
        </p>
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

