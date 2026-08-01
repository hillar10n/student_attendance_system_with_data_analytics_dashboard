import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Deployment path handling:
// - Dev (`npm run dev`): served at the root of the Vite dev server, base '/'.
// - Production build (`npm run build`): defaults to '/sams/', matching the
//   folder name documented in the README (htdocs/sams/). This MUST be an
//   absolute path, not a relative one ('./') - relative paths break when
//   the .htaccess SPA fallback serves index.html for a deep route like
//   /sams/lecturer/analytics, because the browser then resolves './assets/'
//   relative to that deep URL instead of the folder index.html actually
//   lives in.
// - Override for a different folder name: set VITE_BASE_PATH in a `.env`
//   file in this folder before running `npm run build`, e.g.
//   VITE_BASE_PATH=/my-folder/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let basePath = env.VITE_BASE_PATH || (mode === 'production' ? '/sams/' : '/');
  if (!basePath.endsWith('/')) basePath += '/';

  return {
    base: basePath,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
