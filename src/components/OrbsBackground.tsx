import { useEffect, useRef } from 'react';

type OrbConfig = {
  id: string;
  color: string;
  delay: number;
};

const MOBILE_WIDTH = 768;
const COLORS = ['#00ffff', '#ff006e', '#8b5cf6', '#00ff9f', '#ff4d94'];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export default function OrbsBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const orbsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isDesktop = window.innerWidth > MOBILE_WIDTH;
    const orbCount = isDesktop ? 4 : 3;

    // Crear elementos de orbes
    const orbConfigs: OrbConfig[] = [];
    for (let i = 0; i < orbCount; i++) {
      const orb = document.createElement('div');
      orb.className = 'gradient-orb';
      orb.id = `orb-${i}`;

      const color = COLORS[i % COLORS.length];
      const size = isDesktop ? randomBetween(280, 420) : randomBetween(200, 300);

      orb.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        opacity: 0.35;
        filter: blur(80px);
        pointer-events: none;
        z-index: 0;
        background: radial-gradient(circle, ${color}, transparent);
      `;

      container.appendChild(orb);
      orbsRef.current.set(`orb-${i}`, orb);

      orbConfigs.push({
        id: `orb-${i}`,
        color,
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

      // Animar cada orbe
      orbConfigs.forEach((config) => {
        const orb = orbsRef.current.get(config.id);
        if (!orb) return;

        // Animación de movimiento suave y continuo
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
          delay: config.delay,
          easing: 'easeInOutSine',
          loop: true,
        });

        // Animación de pulsación/opacidad
        anime({
          targets: orb,
          opacity: [0.25, 0.45, 0.25],
          duration: randomBetween(3000, 5000),
          delay: config.delay + randomBetween(0, 500),
          easing: 'easeInOutQuad',
          loop: true,
        });

        // Animación de escala suave
        anime({
          targets: orb,
          scale: [0.95, 1.1, 0.95],
          duration: randomBetween(4000, 7000),
          delay: config.delay + randomBetween(200, 800),
          easing: 'easeInOutSine',
          loop: true,
        });
      });

      // Efecto parallax con mouse (solo desktop)
      let mouseHandler: ((e: MouseEvent) => void) | null = null;
      if (isDesktop) {
        mouseHandler = (e: MouseEvent) => {
          const { clientX, clientY } = e;
          const { innerWidth, innerHeight } = window;

          const xPercent = (clientX / innerWidth - 0.5) * 2;
          const yPercent = (clientY / innerHeight - 0.5) * 2;

          Array.from(orbsRef.current.values()).forEach((orb, index) => {
            const speed = (index + 1) * 15;
            try {
              // Use anime.set if available, otherwise set transform directly
              if (anime && typeof anime.set === 'function') {
                anime.set(orb, {
                  translateX: xPercent * speed,
                  translateY: yPercent * speed,
                });
              } else {
                orb.style.transform = `translate(${xPercent * speed}px, ${yPercent * speed}px)`;
              }
            } catch (err) {
              // swallow transform errors to avoid HMR crashes
            }
          });
        };

        document.addEventListener('mousemove', mouseHandler);
      }

      // attach mouseHandler to orbConfigs for cleanup
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

      orbsRef.current.forEach((orb) => {
        try {
          orb.style.transform = '';
        } catch (e) {
          // ignore
        }
        if (orb.parentNode === container) {
          container.removeChild(orb);
        }
      });
      orbsRef.current.clear();
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
