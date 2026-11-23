import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/app/AppShell';
import { FullScreenLoader, RequireAuth, RequireRole } from './components/app/RequireAuth';
import type { Role } from './types/api';
import NotFound from './pages/NotFound';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Home = lazy(() => import('./pages/app/Home'));
const Simulations = lazy(() => import('./pages/app/Simulations'));
const SimulationDetail = lazy(() => import('./pages/app/SimulationDetail'));
const Projections = lazy(() => import('./pages/app/Projections'));
const News = lazy(() => import('./pages/app/News'));
const Notifications = lazy(() => import('./pages/app/Notifications'));
const AdminPanel = lazy(() => import('./pages/app/AdminPanel'));
const Users = lazy(() => import('./pages/app/Users'));
const Audit = lazy(() => import('./pages/app/Audit'));
const Settings = lazy(() => import('./pages/app/Settings'));

const SIMULATE: Role[] = ['INVESTOR', 'ADMIN'];
const STAFF: Role[] = ['ADMIN', 'IT_MANAGER'];
const only = (roles: Role[], node: ReactNode) =>
  page(<RequireRole roles={roles}>{node}</RequireRole>);

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
    children: [
      { index: true, element: page(<Home />) },
      { path: 'simulaciones', element: only(SIMULATE, <Simulations />) },
      // El detalle lo protege el backend (dueño o ADMIN); un admin llega aquí desde el listado general.
      { path: 'simulaciones/:id', element: page(<SimulationDetail />) },
      { path: 'proyecciones', element: only(SIMULATE, <Projections />) },
      { path: 'noticias', element: page(<News />) },
      { path: 'notificaciones', element: page(<Notifications />) },
      { path: 'panel', element: only(['ADMIN'], <AdminPanel />) },
      { path: 'usuarios', element: only(['ADMIN'], <Users />) },
      { path: 'auditoria', element: only(STAFF, <Audit />) },
      { path: 'configuracion', element: only(STAFF, <Settings />) },
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
