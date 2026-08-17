import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroLoader({ duration = 2000 }) {
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const shown = sessionStorage.getItem('civicsnap_intro_shown');
      const isHome = typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname === '/index.html');
      if (shown === 'true' || !isHome) return; // only show on first hard load of homepage
    } catch (e) {
      // ignore sessionStorage errors
    }

    setVisible(true);
    document.body.style.overflow = 'hidden';

    let raf = null;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      setPercent(Math.floor(t * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // ensure 100 shown briefly
        setPercent(100);
        setTimeout(() => setDone(true), 250);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.body.style.overflow = '';
    };
  }, [duration]);

  useEffect(() => {
    if (!done) return;
    // play exit then hide and mark shown
    const t = setTimeout(() => {
      setVisible(false);
      try { sessionStorage.setItem('civicsnap_intro_shown', 'true'); } catch (e) {}
      document.body.style.overflow = '';
    }, 300);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro-loader"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-bottle-900 text-white"
          aria-hidden={!visible}
        >
          <div className="text-center px-6">
            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">CivicSnap</div>
              <div className="text-xs font-extrabold text-pista-300 uppercase tracking-widest">AI CIVIC ISSUE REPORTING</div>
            </div>

            <div className="mt-6">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${percent}%` }}
                transition={{ ease: 'linear', duration: 0.1 }}
                className="h-2 bg-pista-100 rounded-full mx-auto max-w-sm"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              />

              <div className="mt-3 text-sm font-black">{percent}%</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
