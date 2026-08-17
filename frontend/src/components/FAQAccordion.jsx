import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQAccordion({ items = [], className = '', id = 'faq' }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => {
    setOpenIndex(prev => (prev === i ? null : i));
  };

  return (
    <section id={id} className={`max-w-6xl mx-auto px-4 sm:px-8 ${className}`} aria-label="FAQ">
      <div className="bg-transparent">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-bottle-900">Frequently Asked Questions</h2>
          <p className="text-slate-700 text-sm font-semibold">Answers to common questions about reporting, privacy, and how CivicSnap works.</p>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="bg-pista-100 border border-pista-400 rounded-2xl overflow-hidden">
              <button
                aria-expanded={openIndex === idx}
                aria-controls={`faq-panel-${idx}`}
                id={`faq-btn-${idx}`}
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none focus:ring-2 focus:ring-bottle-800"
              >
                <span className="flex-1 text-sm sm:text-base font-black text-bottle-800">{it.question}</span>
                <ChevronDown className={`w-5 h-5 text-bottle-800 transition-transform ${openIndex === idx ? 'rotate-180' : 'rotate-0'}`} aria-hidden />
              </button>

              <div
                id={`faq-panel-${idx}`}
                role="region"
                aria-labelledby={`faq-btn-${idx}`}
                className={`px-4 sm:px-5 pb-4 transition-[max-height,opacity] duration-300 ease-in-out ${openIndex === idx ? 'opacity-100' : 'opacity-0'}`}
                style={{ maxHeight: openIndex === idx ? '600px' : '0px' }}
              >
                <div className="pt-2 text-sm text-slate-700 leading-relaxed">
                  {it.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
