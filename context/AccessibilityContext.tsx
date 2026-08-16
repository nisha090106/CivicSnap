'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type FontScale = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextType {
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  audioAssist: boolean;
  setAudioAssist: (enabled: boolean) => void;
  getTextScaleClass: () => string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScale] = useState<FontScale>('normal');
  const [audioAssist, setAudioAssist] = useState<boolean>(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale);
  }, [fontScale]);

  const getTextScaleClass = () => {
    switch (fontScale) {
      case 'large': return 'text-lg';
      case 'xlarge': return 'text-xl';
      default: return 'text-base';
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontScale,
        setFontScale,
        audioAssist,
        setAudioAssist,
        getTextScaleClass,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

export default AccessibilityProvider;

