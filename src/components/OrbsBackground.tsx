import { useEffect, useRef } from 'react';

type OrbEntry = {
  wrapper: HTMLDivElement;
  orb: HTMLDivElement;
  delay: number;
};

const MOBILE_WIDTH = 768;
const COLORS = ['#00ffff', '#ff006e', '#8b5cf6', '#00ff9f', '#ff4d94'];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export default function OrbsBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Store wrapper (parallax target) and inner orb (anime animation target) separately
  const orbEntriesRef = useRef<OrbEntry[]>([]);

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

    const setupAnimations = async () => {
      // Try importing animejs robustly and fall back safely
      let anime: any = null;
      try {
        const mod = await import('animejs');
        // animejs ESM may export default or named `anime`
        const modAny: any = mod;
        anime = (modAny && (modAny.default || modAny.anime || modAny));
      } catch (err) {
        try {
          // fallback to alternate entrypoint
          // @ts-ignore
          const mod = await import('animejs/lib/anime.es.js');
          // @ts-ignore
          const modAny: any = mod;
          anime = modAny && (modAny.default || modAny.anime || modAny);
          console.warn('[OrbsBackground] animejs failed to load from main entry, loaded from fallback', err);
        } catch (e) {
          // If anime fails to load, log and abort animations
          // eslint-disable-next-line no-console
          console.warn('[OrbsBackground] animejs failed to load', e);
          return;
        }
      }

      if (!anime || typeof anime !== 'function') {
        // If the resolved export isn't callable, try to use .default function
        if (anime && typeof anime.default === 'function') anime = anime.default;
        else {
          // eslint-disable-next-line no-console
          console.warn('[OrbsBackground] animejs export is not a function, aborting animations');
          return;
        }
      }

      // Animate each inner orb (float + scale + opacity) — wrapper is untouched by anime
      orbEntriesRef.current.forEach(({ orb, delay }) => {
        // Smooth continuous float animation
        anime({
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

        // Pulse / opacity animation
        anime({
          targets: orb,
          opacity: [0.25, 0.45, 0.25],
          duration: randomBetween(3000, 5000),
          delay: delay + randomBetween(0, 500),
          easing: 'easeInOutQuad',
          loop: true,
        });

        // Gentle scale animation
        anime({
          targets: orb,
          scale: [0.95, 1.1, 0.95],
          duration: randomBetween(4000, 7000),
          delay: delay + randomBetween(200, 800),
          easing: 'easeInOutSine',
          loop: true,
        });
      });

      // Parallax effect on mouse (desktop only) — applied to wrapper, not the animated inner orb
      let mouseHandler: ((e: MouseEvent) => void) | null = null;
      if (isDesktop) {
        mouseHandler = (e: MouseEvent) => {
          const { clientX, clientY } = e;
          const { innerWidth, innerHeight } = window;

          const xPercent = (clientX / innerWidth - 0.5) * 2;
          const yPercent = (clientY / innerHeight - 0.5) * 2;

          orbEntriesRef.current.forEach(({ wrapper }, index) => {
            const speed = (index + 1) * 15;
            try {
              // Translate the wrapper for parallax; the inner orb's anime transform is unaffected
              wrapper.style.transform = `translate(calc(-50% + ${xPercent * speed}px), calc(-50% + ${yPercent * speed}px))`;
            } catch (err) {
              // swallow transform errors to avoid HMR crashes
            }
          });
        };

        document.addEventListener('mousemove', mouseHandler);
      }

      // attach mouseHandler for cleanup
      (setupAnimations as any)._mouseHandler = mouseHandler;
    };

    void setupAnimations();

    return () => {
      // remove mouse handler if attached
      try {
        const mh = (setupAnimations as any)._mouseHandler;
        if (mh) document.removeEventListener('mousemove', mh);
      } catch (e) {
        // ignore
      }

      orbEntriesRef.current.forEach(({ wrapper }) => {
        if (wrapper.parentNode === container) {
          container.removeChild(wrapper);
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
