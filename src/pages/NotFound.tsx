import { ButtonLink } from '../components/ui/Button';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <p className="num font-display text-6xl font-extrabold text-ember">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold">Esta página no existe</h1>
        <p className="mt-2 text-ash">Revisa la dirección o vuelve al inicio.</p>
        <ButtonLink to="/" className="mt-8">
          Volver al inicio
        </ButtonLink>
      </div>
    </main>
  );
}
