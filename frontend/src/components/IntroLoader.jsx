import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

function shouldShowIntro() {
  if (typeof window === 'undefined') return false;

  const isHome = ['', '/', '/index.html'].includes(window.location.pathname);
  if (!isHome) return false;

  try {
    return sessionStorage.getItem('civicsnap_intro_shown') !== 'true';
  } catch {
    return true;
  }
}

export default function IntroLoader({ duration = 2000, ready = true, onComplete }) {
  const [visible, setVisible] = useState(shouldShowIntro);
  const [percent, setPercent] = useState(0);
  const initiallyVisible = useRef(visible);
  const prefersReducedMotion = useReducedMotion();
  const readyRef = useRef(ready);
  const onCompleteRef = useRef(onComplete);

  readyRef.current = ready;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!initiallyVisible.current) {
      onCompleteRef.current?.();
    }
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    if (prefersReducedMotion) {
      setVisible(false);
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let frameId;
    let holdTimer;
    let fontsLoaded = !document.fonts;
    const startTime = performance.now();

    document.fonts?.ready.then(() => {
      fontsLoaded = true;
    });

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(95, Math.floor((elapsed / duration) * 95));
      setPercent((currentPercent) => Math.max(currentPercent, progress));

      if (elapsed >= Math.max(duration, 1000) && readyRef.current && fontsLoaded) {
        setPercent(100);
        holdTimer = window.setTimeout(() => setVisible(false), 220);
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(holdTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [duration, prefersReducedMotion, visible]);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        try {
          sessionStorage.setItem('civicsnap_intro_shown', 'true');
        } catch {
          // Session storage may be disabled; the intro can still finish normally.
        }
        onCompleteRef.current?.();
      }}
    >
      {visible && (
        <motion.div
          key="intro-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-bottle-900 text-white"
          style={{ willChange: 'opacity' }}
          aria-hidden="true"
        >
          <div className="text-center px-6">
            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">CivicSnap</div>
              <div className="text-xs font-extrabold text-pista-300 uppercase tracking-widest">CIVIC ISSUE REPORTING</div>
            </div>

            <div className="mt-6">
              <div className="h-2 mx-auto max-w-sm bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pista-100 rounded-full transition-[width] duration-100 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-3 text-sm font-black">{percent}%</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
