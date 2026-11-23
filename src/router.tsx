import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/app/AppShell';
import { FullScreenLoader, RequireAuth } from './components/app/RequireAuth';
import NotFound from './pages/NotFound';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Home = lazy(() => import('./pages/app/Home'));

const page = (node: ReactNode) => <Suspense fallback={<FullScreenLoader />}>{node}</Suspense>;

export const router = createBrowserRouter([
  { path: '/', element: page(<Landing />) },
  { path: '/login', element: page(<Login />) },
  { path: '/cambiar-contrasena', element: page(<ChangePassword />) },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [{ index: true, element: page(<Home />) }],
  },
  { path: '*', element: <NotFound /> },
]);
