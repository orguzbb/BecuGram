import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.becugram.app',
  appName: 'BecuGram',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0B1311',
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: '#0B1311',
      style: 'DARK',
    },
  },
};

export default config;

