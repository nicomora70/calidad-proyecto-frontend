import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ThemeProvider } from './theme';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('tema', () => {
  it('alterna entre claro y oscuro y recuerda la elección', async () => {
    document.documentElement.dataset.theme = 'dark';
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('ritech-theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Cambiar a modo oscuro' })).toBeTruthy();
  });
});
