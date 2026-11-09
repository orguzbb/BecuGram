import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { AuthScreen } from './features/authentication/AuthScreen';
import { AppLayout } from './layouts/AppLayout';
import { ToastProvider } from './components/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LottieAnimation } from './components/LottieAnimation';

const queryClient = new QueryClient();

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isInitialized, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!isInitialized || isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0B1311] text-white select-none">
        <div className="relative mb-3 flex items-center justify-center">
          <LottieAnimation src="/animations/loading.json" size={160} loop={true} autoplay={true} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white/95">BecuGram</h1>
        <p className="text-xs text-[#8DA39A] tracking-wide mt-1 font-medium">
          Yuklanmoqda...
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

