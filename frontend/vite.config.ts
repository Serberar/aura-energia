import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      visualizer({
        filename: '.stats/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
      preprocessorOptions: {
        scss: {
          additionalData: '',
        },
      },
    },

    server: {
      host: true,
      port: parseInt(env.VITE_DEV_PORT || '5173'),
      allowedHosts: [env.VITE_DEV_HOST || 'localhost'],
      proxy: {
        '/php': {
          target: env.VITE_1SKORE_TARGET || 'https://ws.1skore.com',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
            router: ['react-router-dom'],
            axios: ['axios'],
            auth: [
              './src/features/auth/authSlice.ts',
              './src/features/auth/services/authService.ts'
            ],
            skore: [
              './src/features/1skore/skoreSlice.ts',
              './src/features/1skore/services/skoreService.ts'
            ],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    // Eliminar console.log y console.debug en producción
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
  };
});
