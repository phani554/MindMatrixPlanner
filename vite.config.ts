import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    // Added server configuration with proxy for authentication
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5100',
          changeOrigin: true,
        },
        '/auth': {
          target: 'http://localhost:5100',
          changeOrigin: true,
          secure: false,
        },
      }
    }
  };
  
});
