import { useEffect, useRef } from 'react';

type OrbEntry = {
  wrapper: HTMLDivElement;
  orb: HTMLDivElement;
  delay: number;
};

type AnimeInstance = {
  pause: () => void;
};

type AnimeFactory = (config: Record<string, unknown>) => AnimeInstance;
type AnimeModule = {
  default?: unknown;
  anime?: unknown;
};

const MOBILE_WIDTH = 768;
const COLORS = ['#00ffff', '#ff006e', '#8b5cf6', '#00ff9f', '#ff4d94'];

function randomBetween(min: number, max: number): number {
  const crypto = globalThis.crypto || (globalThis as any).msCrypto;
  return crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff * (max - min) + min;
}

// Try to import animejs with a safe fallback and return the callable anime function or null
export async function loadAnime(
  importMain: () => Promise<AnimeModule> = () => import('animejs'),
  importFallback: () => Promise<AnimeModule> = () => import('animejs/lib/anime.es.js'),
): Promise<AnimeFactory | null> {
  let anime: AnimeFactory | null = null;
  try {
    const mod = await importMain();
    anime = (mod && (mod.default || mod.anime || mod)) as AnimeFactory | null;
  } catch (err) {
    try {
      const mod = await importFallback();
      anime = (mod && (mod.default || mod.anime || mod)) as AnimeFactory | null;
      // eslint-disable-next-line no-console
      console.warn('[OrbsBackground] animejs failed to load from main entry, loaded from fallback', err);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[OrbsBackground] animejs failed to load', e);
      return null;
    }
  }

  if (!anime || typeof anime !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('[OrbsBackground] animejs export is not a function, aborting animations');
    return null;
  }

  return anime;
}

function createMouseHandler(orbEntriesRef: { current: OrbEntry[] }) {
  return (e: MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = globalThis as any;

    const xPercent = (clientX / innerWidth - 0.5) * 2;
    const yPercent = (clientY / innerHeight - 0.5) * 2;

    orbEntriesRef.current.forEach(({ wrapper }, index) => {
      const speed = (index + 1) * 15;
      wrapper.style.transform = `translate(calc(-50% + ${xPercent * speed}px), calc(-50% + ${yPercent * speed}px))`;
    });
  };
}

type StartAnimationsParams = {
  orbEntriesRef: { current: OrbEntry[] };
  animationInstancesRef: { current: Array<{ pause: () => void }> };
  mouseHandlerRef: { current: ((e: MouseEvent) => void) | null };
  container: HTMLDivElement | null;
  isDesktop: boolean;
  cancelled: { value: boolean };
};

async function startAnimations({ orbEntriesRef, animationInstancesRef, mouseHandlerRef, container, isDesktop, cancelled }: StartAnimationsParams) {
  const anime = await loadAnime();
  if (cancelled.value) return;
  if (!anime) return;

  orbEntriesRef.current.forEach(({ orb, delay }) => {
    try {
      const floatAnim = anime({
        targets: orb,
        translateX: [
          randomBetween(-150, 150),
          randomBetween(-150, 150),
          randomBetween(-150, 150),
        ],
        translateY: [
          randomBetween(-120, 120),
          randomBetween(-120, 120),
          randomBetween(-120, 120),
        ],
        duration: randomBetween(8000, 15000),
        delay,
        easing: 'easeInOutSine',
        loop: true,
      });

      const opacityAnim = anime({
        targets: orb,
        opacity: [0.25, 0.45, 0.25],
        duration: randomBetween(3000, 5000),
        delay: delay + randomBetween(0, 500),
        easing: 'easeInOutQuad',
        loop: true,
      });

      const scaleAnim = anime({
        targets: orb,
        scale: [0.95, 1.1, 0.95],
        duration: randomBetween(4000, 7000),
        delay: delay + randomBetween(200, 800),
        easing: 'easeInOutSine',
        loop: true,
      });

      animationInstancesRef.current.push(floatAnim, opacityAnim, scaleAnim);
    } catch (err) {
      // If one orb animation creation fails, continue with others
      // eslint-disable-next-line no-console
      console.warn('[OrbsBackground] failed to create orb animations', err);
    }
  });

  if (isDesktop && !cancelled.value) {
    const handler = createMouseHandler(orbEntriesRef);
    mouseHandlerRef.current = handler;
    document.addEventListener('mousemove', handler);
  }
}

export default function OrbsBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Store wrapper (parallax target) and inner orb (anime animation target) separately
  const orbEntriesRef = useRef<OrbEntry[]>([]);
  // Dedicated ref for the parallax mouse handler so cleanup is always deterministic
  const mouseHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  // Refs for animation instances so they can be paused on unmount
  const animationInstancesRef = useRef<Array<{ pause: () => void }>>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isDesktop = window.innerWidth > MOBILE_WIDTH;
    const orbCount = isDesktop ? 4 : 3;

    // Create wrapper + inner orb pairs so parallax and float animations use separate elements
    for (let i = 0; i < orbCount; i++) {
      const color = COLORS[i % COLORS.length];
      const size = isDesktop ? randomBetween(280, 420) : randomBetween(200, 300);

      // Wrapper: handles parallax offset via its own transform (not touched by anime)
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${randomBetween(10, 80)}%;
        top: ${randomBetween(10, 80)}%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 0;
        will-change: transform;
      `;

      // Inner orb: animated by anime (translateX/Y, scale, opacity) independently
      const orb = document.createElement('div');
      orb.className = 'gradient-orb';
      orb.style.cssText = `
        position: absolute;
        inset: 0;
        border-radius: 50%;
        opacity: 0.35;
        filter: blur(80px);
        background: radial-gradient(circle, ${color}, transparent);
        will-change: transform, opacity;
      `;

      wrapper.appendChild(orb);
      container.appendChild(wrapper);

      orbEntriesRef.current.push({
        wrapper,
        orb,
        delay: randomBetween(0, 1500),
      });
    }

    // Cancellation token object for cross-scope signaling
    const cancelled = { value: false };

    // Start animations using the shared helper to reduce nesting
    void startAnimations({ orbEntriesRef, animationInstancesRef, mouseHandlerRef, container, isDesktop, cancelled });

    return () => {
      cancelled.value = true;

      // Pause all running anime instances to stop their internal RAF loops
      animationInstancesRef.current.forEach(inst => {
        inst.pause();
      });
      animationInstancesRef.current = [];

      // Remove the parallax mouse handler using the dedicated ref
      if (mouseHandlerRef.current) {
        document.removeEventListener('mousemove', mouseHandlerRef.current);
        mouseHandlerRef.current = null;
      }

      orbEntriesRef.current.forEach(({ wrapper }) => {
        if (wrapper.parentNode === container) {
          wrapper.remove();
        }
      });
      orbEntriesRef.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 bg-linear-to-br from-[#030617] via-[#0f0820] to-[#1a0f2e] overflow-hidden"
      aria-hidden="true"
    />
  );
}
