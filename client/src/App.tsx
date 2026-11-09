import React, { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { AuthScreen } from './features/authentication/AuthScreen';
import { AppLayout } from './layouts/AppLayout';
import { ToastProvider } from './components/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LottieAnimation } from './components/LottieAnimation';

const queryClient = new QueryClient();

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isInitialized, initAuth } = useAuthStore();
  const [minLoading, setMinLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Loading screen 6 seconds per user request
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoading(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized || isLoading || minLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#070D0B] text-white select-none transition-opacity duration-500">
        <div className="relative mb-4 flex items-center justify-center">
          <LottieAnimation src="/animations/loading.json" size={170} loop={true} autoplay={true} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white/95">BecuGram</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <p className="text-xs text-[#8DA39A] tracking-wider font-semibold">
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

