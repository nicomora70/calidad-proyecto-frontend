import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../lib/theme';

/** Muestra la ruta actual para comprobar redirecciones. */
function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname}</p>;
}

/** Renderiza una pantalla en una ruta, con tema y enrutador, y marcadores para las rutas destino. */
export function renderAt(path: string, element: ReactNode, targets: string[] = []) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={element} />
          {targets.map((t) => (
            <Route key={t} path={t} element={<Where />} />
          ))}
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
