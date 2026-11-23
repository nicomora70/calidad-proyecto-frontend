const STEPS = [
  {
    title: 'Recibes tu acceso',
    text: 'El administrador de tu empresa crea tu cuenta y te entrega una contraseña temporal.',
  },
  {
    title: 'Eliges tu contraseña',
    text: 'En tu primer ingreso cambias la contraseña temporal por una que solo tú conozcas.',
  },
  {
    title: 'Simulas y decides',
    text: 'Ingresa tu capital, revisa el resultado x2, la alerta con IA y las proyecciones.',
  },
];

export function Steps() {
  return (
    <section id="acceso" className="scroll-mt-24 border-y border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <h2 className="display max-w-2xl text-4xl font-bold sm:text-5xl">
          Empiezas en tres pasos.
        </h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative md:pr-8">
              <span className="num font-display text-6xl font-extrabold text-ember/90">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 max-w-[38ch] text-ash">{s.text}</p>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-8 right-0 left-20 hidden h-px bg-gradient-to-r from-line to-transparent md:block"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
