import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CapitalInput } from '../app/CapitalInput';
import { Modal } from './Modal';

afterEach(cleanup);

function ControlledCapital({ onDigits }: { onDigits: (d: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <CapitalInput
      value={value}
      onChange={(d) => {
        setValue(d);
        onDigits(d);
      }}
    />
  );
}

describe('CapitalInput', () => {
  it('acepta solo dígitos y muestra separadores de miles', async () => {
    const onDigits = vi.fn();
    render(<ControlledCapital onDigits={onDigits} />);
    const input = screen.getByLabelText('Capital a invertir') as HTMLInputElement;
    await userEvent.type(input, '01a2b5000.00');
    // Dígitos 0 1 2 5 0 0 0 0 0, sin el cero inicial.
    expect(onDigits).toHaveBeenLastCalledWith('12500000');
    expect(input.value).toBe('12.500.000');
  });
});

describe('Modal', () => {
  it('enfoca el primer campo y se cierra con Escape', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Crear usuario" onClose={onClose}>
        <input aria-label="Nombre" />
        <button type="button">Guardar</button>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Crear usuario' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Nombre'));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('mantiene el foco dentro del diálogo con Tab', async () => {
    render(
      <Modal title="Confirmar" onClose={() => {}}>
        <button type="button">Cancelar</button>
        <button type="button">Eliminar</button>
      </Modal>,
    );
    const ue = userEvent.setup();
    // Botones: Cerrar, Cancelar, Eliminar. Desde el último, Tab vuelve al primero.
    screen.getByRole('button', { name: 'Eliminar' }).focus();
    await ue.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar' }));
  });
});
