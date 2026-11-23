# RiTech — Frontend

Interfaz web de RiTech, el software de apoyo a decisiones para inversiones que siguen el
**NASDAQ 100 con apalancamiento x2**. Incluye la página pública y la aplicación por rol
(inversionista, administrador y gerente de TI), y consume la API de
[calidad-proyecto-backend](https://github.com/nicomora70/calidad-proyecto-backend-).

**Stack:** React 19 · TypeScript (strict) · Vite · Tailwind CSS 4 · React Router · TanStack Query ·
Recharts · Framer Motion · Lenis · Vitest + Testing Library.

## Requisitos

- Node.js **22** (ver `.nvmrc`; Vite exige 20.19+ o 22.12+).
- La API del backend con rutas **`/api/v1`** (fase 6 del backend en adelante).

## Puesta en marcha

```bash
npm ci
cp .env.example .env     # VITE_API_URL=http://localhost:8080
npm run dev              # http://localhost:3000
```

El servidor de desarrollo usa el puerto **3000** porque es el origen que el backend permite por
defecto en `CORS_ALLOWED_ORIGINS`. Si el frontend se sirve desde otro dominio, hay que agregarlo
en esa variable del backend.

| Variable       | Para qué                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | URL base de la API, sin `/api/v1` (por defecto `http://localhost:8080`). Se fija al compilar. |

## Scripts

| Comando             | Qué hace                                                                          |
| ------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con recarga en caliente                                    |
| `npm run build`     | Revisa tipos y genera `dist/`                                                     |
| `npm run preview`   | Sirve `dist/` en el puerto 3000                                                   |
| `npm run lint`      | ESLint (incluye reglas de React Hooks)                                            |
| `npm run typecheck` | TypeScript sin emitir                                                             |
| `npm test`          | Pruebas con Vitest                                                                |
| `npm run coverage`  | Pruebas con cobertura (umbrales: 70 % líneas, funciones y sentencias; 60 % ramas) |
| `npm run check`     | Todo lo anterior, como en el CI                                                   |

## Pantallas por rol

| Ruta                                         | Pantalla                                                             | Roles                |
| -------------------------------------------- | -------------------------------------------------------------------- | -------------------- |
| `/`                                          | Landing con simulador x2 interactivo                                 | Público              |
| `/login`, `/cambiar-contrasena`              | Ingreso y cambio de contraseña (obligatorio con contraseña temporal) | Público / con sesión |
| `/app`                                       | Inicio: KPIs, índice vs. retorno x2, ánimo del mercado               | Todos                |
| `/app/simulaciones`, `/app/simulaciones/:id` | Nueva simulación, historial, exporte CSV, detalle con alerta IA      | Inversionista, Admin |
| `/app/proyecciones`                          | Escenarios P10 / P50 / P90 y probabilidad de pérdida                 | Inversionista, Admin |
| `/app/noticias`                              | Noticias y sentimiento del día                                       | Todos                |
| `/app/notificaciones`                        | Bandeja y preferencias                                               | Todos                |
| `/app/panel`                                 | Estadísticas y todas las simulaciones                                | Admin                |
| `/app/usuarios`                              | Crear, editar, desactivar y eliminar usuarios                        | Admin                |
| `/app/auditoria`                             | Registro de auditoría con exporte                                    | Admin, Gerente de TI |
| `/app/configuracion`                         | Licencia (Admin, Gerente de TI) y branding (Admin)                   | Admin, Gerente de TI |

La interfaz oculta lo que cada rol no puede usar, pero **la autorización real la hace el backend**.

## Estructura

```
src/
  lib/          api.ts (cliente HTTP y sesión), auth.tsx, errors.ts, format.ts, queries.ts, theme.tsx
  components/
    ui/         Button, Field, Modal, Surface (Card, estados vacío/error, paginación), Toast, Logo
    app/        AppShell, RequireAuth, gráficas y controles de la aplicación
    landing/    Secciones de la página pública (Hero, X2Lens, Bento, Steps, Faq)
  pages/        Landing, Login, ChangePassword y pages/app/* (una por ruta, con carga diferida)
  styles/       index.css: tokens de color, tipografía y escala
  types/        api.ts: contratos de la API (DTOs)
```

## Sesión y seguridad

- **Tokens:** el access token y el refresh token viven en memoria. El refresh token solo se deja
  en `sessionStorage` durante `pagehide` y se retira al arrancar: una recarga conserva la sesión,
  pero "Duplicar pestaña" no hereda un token de un solo uso. Si se reutilizara uno, el backend
  cerraría todas las sesiones del usuario (`REFRESH_TOKEN_REUSED`).
- **Renovación:** ante `401 TOKEN_EXPIRED` se renueva una sola vez, compartida entre peticiones
  concurrentes, y se reintenta. Si el backend rechaza el refresh, se vuelve al login.
- **Errores:** las respuestas RFC 7807 se convierten en `ApiError` con mensajes en español por código.
  `429 RATE_LIMITED` indica cuántos segundos esperar (`Retry-After`) y los errores 5xx muestran el
  `traceId` como código para soporte.
- Sin cookies, así que no hace falta CSRF. El logout revoca el refresh token en el backend.

## Diseño

- **Tokens** en `src/styles/index.css`, con modo claro y oscuro (`data-theme`, sin parpadeo al cargar).
  Naranja = tu inversión x2; azul = el índice y las pérdidas. Los colores de las gráficas están
  validados en ambos modos (luminosidad, croma y separación para daltonismo).
- **Tipografía:** Manrope 700/800 para titulares y cifras; Inter 400/500/600 para la interfaz.
  Cifras tabulares en montos y porcentajes.
- **Movimiento:** una sola animación automática (el simulador del hero). Scroll suave con Lenis solo
  en la landing. Todo respeta `prefers-reduced-motion`.
- **Accesibilidad:** foco visible, diálogos con foco atrapado, gráficas con leyenda y vista de tabla,
  y ganancia/pérdida indicadas con signo y texto, no solo con color.

## Calidad

- **CI** (`.github/workflows/ci.yml`, en cada PR y en `main`): formato (Prettier), ESLint, TypeScript,
  pruebas con cobertura, build y `npm audit` de las dependencias de producción. Publica la
  cobertura y el `dist/` como artefactos.
- **Pruebas:** cliente HTTP y renovación de sesión, contexto de autenticación, guardas de rutas,
  ingreso, cambio de contraseña, formato de cifras y fechas, mensajes de error, diálogo modal y
  campo de capital.

## Despliegue

`npm run build` genera un sitio estático en `dist/`. El servidor que lo publique debe devolver
`index.html` para cualquier ruta que no sea un archivo (rutas de la SPA), y su dominio debe estar en
`CORS_ALLOWED_ORIGINS` del backend. Como `VITE_API_URL` se fija al compilar, cada instalación de
cliente necesita su propio build.
