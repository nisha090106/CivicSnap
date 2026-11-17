import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const BUBBLE_COLORS = [
  [126, 166, 112],
  [140, 177, 123],
  [153, 184, 130],
  [119, 158, 104]
];

export default function BackgroundBubbles({ variant = 'full' }) {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );

  const bubbles = useMemo(() => Array.from({ length: isMobile ? 10 : 24 }, (_, index) => {
    const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const opacity = 0.08 + Math.random() * 0.12;
    const isOutlined = index % 5 === 0;
    const radii = Array.from({ length: 8 }, () => 42 + Math.random() * 16);
    const bubbleCount = isMobile ? 10 : 24;
    const verticalPosition = (index + Math.random() * 0.7) / bubbleCount * 100;
    const sizeRange = [
      [85, 135],
      [60, 95],
      [40, 65],
      [25, 45]
    ][index % 4];

    return {
      id: index,
      size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
      borderRadius: `${radii.slice(0, 4).map((radius) => `${radius}%`).join(' ')} / ${radii.slice(4).map((radius) => `${radius}%`).join(' ')}`,
      left: Math.random() * 100,
      top: variant === 'bottom' ? 80 + Math.random() * 20 : verticalPosition,
      color,
      opacity,
      isOutlined,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 5,
      drift: 6 + Math.random() * 9,
      scale: 1 + Math.random() * 0.08
    };
  }), [isMobile, variant]);

  const blobs = useMemo(() => [
    { id: 'left', left: '-10%', top: '-35%', duration: 30, delay: -8, x: 45, y: 35 },
    { id: 'right', right: '-12%', top: '12%', duration: 34, delay: -16, x: -40, y: -30 },
    { id: 'bottom', left: '35%', bottom: '-55%', duration: 38, delay: -22, x: 25, y: -35 }
  ], []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMobile = () => setIsMobile(mediaQuery.matches);

    updateMobile();
    mediaQuery.addEventListener('change', updateMobile);
    return () => mediaQuery.removeEventListener('change', updateMobile);
  }, []);

  const visibleBubbles = bubbles;
  const containerStyle = variant === 'bottom'
    ? {
        maskImage: 'linear-gradient(to top, black 0%, black 15%, transparent 40%)',
        WebkitMaskImage: 'linear-gradient(to top, black 0%, black 15%, transparent 40%)'
      }
    : undefined;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      style={containerStyle}
    >
      {variant === 'full' && blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
          style={{
            left: blob.left,
            right: blob.right,
            top: blob.top,
            bottom: blob.bottom,
            background: 'radial-gradient(circle, rgba(126,166,112,0.2) 0%, rgba(164,190,142,0.1) 38%, transparent 70%)',
            willChange: 'transform'
          }}
          animate={prefersReducedMotion
            ? { x: 0, y: 0, opacity: 0.14 }
            : { x: [0, blob.x, 0], y: [0, blob.y, 0], opacity: [0.1, 0.16, 0.1] }}
          transition={prefersReducedMotion
            ? { duration: 0 }
            : { duration: blob.duration, delay: blob.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {visibleBubbles.map((bubble) => {
        const color = bubble.color.join(',');
        const style = {
          left: `${bubble.left}%`,
          top: `${bubble.top}%`,
          width: bubble.size,
          height: bubble.size,
          borderRadius: bubble.borderRadius,
          border: bubble.isOutlined
            ? `1px solid rgba(${color},0.2)`
            : '1px solid transparent',
          background: bubble.isOutlined
            ? 'transparent'
            : `radial-gradient(circle at 35% 35%, rgba(${color},${bubble.opacity}), rgba(${color},${bubble.opacity * 0.45}) 62%, transparent 100%)`,
          willChange: 'transform'
        };

        return (
          <motion.div
            key={bubble.id}
            className="absolute"
            style={style}
            animate={prefersReducedMotion
              ? { x: 0, y: 0, scale: 1, opacity: bubble.isOutlined ? 0.2 : 1 }
              : variant === 'bottom'
                ? {
                    x: [0, bubble.drift, 0],
                    y: [20, -110, -300],
                    scale: [1, bubble.scale, 1],
                    opacity: [0, bubble.opacity, 0]
                  }
                : {
                    x: [0, bubble.drift, 0],
                    y: [0, -30, 0],
                    scale: [1, bubble.scale, 1],
                    opacity: bubble.isOutlined ? [0.12, 0.2, 0.12] : 1
                  }}
            transition={prefersReducedMotion
              ? { duration: 0 }
              : { duration: bubble.duration, delay: bubble.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        );
      })}
    </div>
  );
}
