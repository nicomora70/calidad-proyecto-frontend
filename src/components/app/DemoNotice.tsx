/** Aviso visible de que el dashboard muestra datos de ejemplo (aún no hay simulaciones reales). */
export function DemoNotice() {
  return (
    <p className="rounded-card border border-line bg-surface px-4 py-2.5 text-sm text-ash">
      <span className="mr-2 rounded-full bg-ember/15 px-2 py-0.5 text-xs font-semibold text-ember">
        Datos de ejemplo
      </span>
      Aún no hay simulaciones registradas; así se verá el panel cuando las haya.
    </p>
  );
}
