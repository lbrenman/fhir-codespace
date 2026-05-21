import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env from project root
  const env = loadEnv(mode, process.cwd() + '/..', '');
  const fhirBaseUrl = env.FHIR_BASE_URL || '';
  const apiKey = env.FHIR_API_KEY || '';
  const backendUrl = `http://localhost:${env.PORT || 3000}`;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: !fhirBaseUrl ? {
        '/fhir': { target: backendUrl, changeOrigin: true },
        '/health': { target: backendUrl, changeOrigin: true },
        '/swagger': { target: backendUrl, changeOrigin: true },
      } : undefined,
    },
    define: {
      '__FHIR_BASE_URL__': JSON.stringify(fhirBaseUrl),
      '__FHIR_API_KEY__': JSON.stringify(apiKey),
    },
  };
});
