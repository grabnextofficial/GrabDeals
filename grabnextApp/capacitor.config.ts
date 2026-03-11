import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'grabnextApp',
  webDir: 'dist',
  server: {
    url: "https://grabnext.pages.dev",
    cleartext: true
  }
};

export default config;
