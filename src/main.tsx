import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './lib/auth';
import { ApiError } from './lib/errors';
import { ThemeProvider } from './lib/theme';
import { router } from './router';
import './styles/index.css';

// Tras un despliegue, una pestaña abierta pide chunks con hashes que ya no existen: recargar una vez
// trae la versión nueva. La marca en sessionStorage evita un bucle si el fallo es otro.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('ritech-reload-at') ?? 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem('ritech-reload-at', String(Date.now()));
  } catch {
    // sin sessionStorage: recargar igual
  }
  event.preventDefault();
  window.location.reload();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Reintenta solo fallos de red o del servidor, nunca errores del cliente (4xx).
      retry: (count, err) =>
        count < 2 && !(err instanceof ApiError && err.status >= 400 && err.status < 500),
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
