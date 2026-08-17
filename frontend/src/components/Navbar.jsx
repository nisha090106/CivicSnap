import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar({ tabs = null }) {
  const [open, setOpen] = useState(false);

  const navTabs = tabs || [
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Features', id: 'features' },
    { label: 'FAQ', id: 'faq' }
  ];

  const handleClick = (e, id) => {
    e.preventDefault();
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="sticky top-0 z-[100] bg-bottle-900 border-b border-bottle-800 px-4 sm:px-8 py-4 sm:py-5 shadow-md text-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-bottle-800 border border-bottle-700 flex items-center justify-center text-2xl font-bold shadow-inner">
            📸
          </div>
          <div>
            <span className="text-2xl lg:text-3xl font-black tracking-tight text-white block leading-tight">CivicSnap</span>
            <span className="text-[11px] lg:text-xs font-extrabold text-pista-300 uppercase tracking-widest block">AI Civic Issue Reporting</span>
          </div>
        </div>

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center space-x-6">
          {navTabs.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              onClick={(e) => handleClick(e, t.id)}
              className="text-white font-extrabold text-sm lg:text-base px-3 py-2 rounded-md hover:bg-bottle-800/30 hover:text-pista-50 transition-colors duration-150"
            >
              {t.label}
            </a>
          ))}
        </nav>

        {/* Right actions + mobile hamburger */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-3">
            <button onClick={() => window.dispatchEvent(new CustomEvent('civicsnap:openAuth', { detail: { tab: 'login', role: 'citizen' } }))} className="px-4 sm:px-5 py-2.5 rounded-xl border border-bottle-700 text-white hover:bg-bottle-800/60 font-extrabold text-xs sm:text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-pista-300">Login</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('civicsnap:openAuth', { detail: { tab: 'signup', role: 'citizen' } }))} className="px-4 sm:px-6 py-2.5 rounded-xl bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 text-white font-black text-xs sm:text-sm transition-colors duration-150 shadow-md focus:outline-none focus:ring-2 focus:ring-pista-300">Sign Up</button>
          </div>

          <button className="md:hidden p-2 text-white rounded-md hover:bg-bottle-800/30 transition-colors duration-150" aria-label="Toggle navigation" onClick={() => setOpen(o => !o)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden bg-bottle-900 border-t border-bottle-800 ${open ? 'block' : 'hidden'}`}>
        <div className="px-4 py-3 space-y-2">
          {navTabs.map(t => (
            <a key={t.id} href={`#${t.id}`} onClick={(e) => handleClick(e, t.id)} className="block text-white font-extrabold py-2 px-2 rounded-md hover:bg-bottle-800/20 transition-colors duration-150">{t.label}</a>
          ))}
          <div className="pt-2 border-t border-bottle-800">
            <button onClick={() => window.dispatchEvent(new CustomEvent('civicsnap:openAuth', { detail: { tab: 'login', role: 'citizen' } }))} className="w-full text-left px-2 py-3 text-white font-extrabold border-b border-bottle-700 rounded-md hover:bg-bottle-800/20 transition-colors duration-150">Login</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('civicsnap:openAuth', { detail: { tab: 'signup', role: 'citizen' } }))} className="w-full text-left px-2 py-3 text-white font-black border border-bottle-700 rounded-md hover:bg-bottle-800/20 transition-colors duration-150 mt-2">Sign Up</button>
          </div>
        </div>
      </div>
    </header>
  );
}
