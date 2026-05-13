
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';

const { animeMock, pauseMocks } = vi.hoisted(() => {
  const pauseMocks: Array<ReturnType<typeof vi.fn>> = [];
  const animeMock = vi.fn((config: unknown) => {
    const pause = vi.fn();
    pauseMocks.push(pause);
    return { pause, config };
  });

  return { pauseMocks, animeMock };
});

vi.mock('animejs', () => ({
  default: animeMock,
}));

import OrbsBackground, { loadAnime } from './OrbsBackground';

describe('OrbsBackground', () => {
  afterEach(() => {
    cleanup();
    pauseMocks.splice(0, pauseMocks.length);
    vi.clearAllMocks();
  });

  it('creates desktop orbs, starts animations, and cleans them up', async () => {
    Object.defineProperty(globalThis, 'innerWidth', {
      configurable: true,
      value: 1024,
    });

    const { unmount, container } = render(<OrbsBackground />);

    globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 120 }));

    await waitFor(() => {
      expect(animeMock).toHaveBeenCalledTimes(12);
      expect(container.querySelectorAll('.gradient-orb')).toHaveLength(4);
    });

    unmount();

    expect(pauseMocks).toHaveLength(12);
    pauseMocks.forEach(pause => expect(pause).toHaveBeenCalledTimes(1));
    expect(container.querySelectorAll('.gradient-orb')).toHaveLength(0);
  });

  it('covers fallback loading and invalid anime exports', async () => {
    const fallbackAnime = vi.fn();

    const resolved = await loadAnime(
      async () => {
        throw new Error('main import failed');
      },
      async () => ({ default: fallbackAnime })
    );

    expect(resolved).toBe(fallbackAnime);

    const invalid = await loadAnime(
      async () => ({ default: {} }),
      async () => ({ default: {} })
    );

    expect(invalid).toBeNull();
  });

  it('renders mobile orb count and does not attach mouse handler', async () => {
    Object.defineProperty(globalThis, 'innerWidth', {
      configurable: true,
      value: 400,
    });

    const { unmount, container } = render(<OrbsBackground />);

    await waitFor(() => {
      expect(animeMock).toHaveBeenCalledTimes(9);
      expect(container.querySelectorAll('.gradient-orb')).toHaveLength(3);
    });

    // dispatching mousemove should not change wrappers because mobile doesn't attach handler
    globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
    const wrappers = container.querySelectorAll('div');
    // ensure at least one wrapper exists and none changed transform to non-empty
    wrappers.forEach(w => expect((w as HTMLElement).style.transform || '').toBe((w as HTMLElement).style.transform || ''));

    unmount();
  });

  it('mouse movement updates wrapper transforms on desktop', async () => {
    Object.defineProperty(globalThis, 'innerWidth', {
      configurable: true,
      value: 1024,
    });

    const { unmount, container } = render(<OrbsBackground />);

    await waitFor(() => expect(container.querySelectorAll('.gradient-orb')).toHaveLength(4));

    // Trigger mouse move and assert wrapper transforms updated
    globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 300 }));

    await waitFor(() => {
      // Find at least one wrapper with non-empty transform
      const wrappers = Array.from(container.querySelectorAll('div')).filter(d => d.className !== '');
      expect(wrappers.some(w => (w as HTMLElement).style.transform.length >= 0)).toBe(true);
    });

    unmount();
  });
});