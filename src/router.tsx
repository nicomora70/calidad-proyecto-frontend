import { createBrowserRouter } from 'react-router-dom';
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '*', element: <NotFound /> },
]);
