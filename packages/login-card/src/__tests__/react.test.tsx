import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CardSheet, LoginCard } from '../react';
import { LoginCodeScanner } from '../scanner-react';
import { fakeCode } from './helpers';

describe('LoginCard and CardSheet', () => {
  it('render each card in the chosen layout', () => {
    const { container } = render(
      <CardSheet
        layout="wallet"
        cards={[
          { code: fakeCode(), name: 'Robin' },
          { code: fakeCode(), name: 'Sam' },
        ]}
      />
    );
    expect(container.querySelector('.plx-card-sheet')?.getAttribute('data-layout')).toBe('wallet');
    expect(container.querySelectorAll('.plx-login-card img')).toHaveLength(2);
    expect(screen.getByAltText('Login card for Sam')).toBeTruthy();
  });

  it('throws for a value that is not a code', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<LoginCard card={{ code: 'https://example.com', name: 'X' }} />)).toThrow();
  });
});

describe('LoginCodeScanner', () => {
  it('says the camera is not allowed and offers typing', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: () =>
          Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })),
      },
      configurable: true,
    });
    const onTypeInstead = vi.fn();
    render(<LoginCodeScanner onCode={vi.fn()} onTypeInstead={onTypeInstead} />);
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/not allowed/));
    screen.getByText('Type my code instead').click();
    expect(onTypeInstead).toHaveBeenCalled();
  });
});
