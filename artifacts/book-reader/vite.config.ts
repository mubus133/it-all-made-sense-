import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

export default defineConfig(async ({ command }) => {
  // Only require PORT for dev/preview servers. During `vite build` (command === 'build')
  // Vercel does not provide a PORT, so provide a sensible default instead of throwing.
  const rawPort = process.env.PORT;

  if ((command === 'serve' || command === 'preview') && !rawPort) {
    throw new Error('PORT environment variable is required when running the dev/preview server.');
  }

  const port = Number(rawPort ?? 5173);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  // Use a default base path for builds when BASE_PATH is not set.
  const basePath = process.env.BASE_PATH ?? '/';

  const plugins: any[] = [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
  ];

  if (process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined) {
    // only load these dev-only plugins when in the Replit dev environment
    const cartographer = (await import('@replit/vite-plugin-cartographer')).cartographer;
    const devBanner = (await import('@replit/vite-plugin-dev-banner')).devBanner;

    plugins.push(
      cartographer({
        root: path.resolve(import.meta.dirname, '..'),
      }),
      devBanner(),
    );
  }

  return {
    base: basePath,
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(import.meta.dirname, '..', '..', 'attached_assets'),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
