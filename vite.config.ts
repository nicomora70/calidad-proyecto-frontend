/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 3000 es el origen que el backend permite por defecto en CORS_ALLOWED_ORIGINS.
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      // Lógica de sesión, errores, formato y los formularios críticos.
      include: [
        'src/lib/**',
        'src/components/app/RequireAuth.tsx',
        'src/components/app/CapitalInput.tsx',
        'src/components/ui/Modal.tsx',
        'src/pages/Login.tsx',
        'src/pages/ChangePassword.tsx',
      ],
      // smooth-scroll y queries solo envuelven Lenis y React Query; se revisan en el recorrido visual.
      exclude: ['**/*.test.*', 'src/lib/smooth-scroll.tsx', 'src/lib/queries.ts'],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
  },
});
