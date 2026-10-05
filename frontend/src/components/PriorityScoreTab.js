import React from 'react';

export default function PriorityScoreTab({ active, onClick }) {
  return React.createElement(
    'button',
    {
      type: 'button',
      onClick,
      'aria-pressed': active,
      className: `px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
        active
          ? 'bg-[#072818] text-white shadow-xs'
          : 'bg-pista-100 text-slate-700 hover:bg-pista-200'
      }`
    },
    'Priority Score'
  );
}
