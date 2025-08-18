/**
 * ======================= I18nUiContext.js =======================
 *
 * 🧭 Lightweight UI-locale context (client)
 * - Exposes `uiLocale` for providers/UI that need instant locale
 * - Complements `useT()` — not a replacement
 *
 */

'use client';

import React, { createContext, useContext, useMemo } from 'react';

const I18nUiContext = createContext({ uiLocale: 'en' });

export function I18nUiProvider({ locale = 'en', children }) {
  // 🧠 keep stable value per active locale
  const contextValue = useMemo(() => ({ uiLocale: locale }), [locale]); // 🧩 memoized
  return <I18nUiContext.Provider value={contextValue}>{children}</I18nUiContext.Provider>;
}

export function useUILocale() {
  // 🖱️ read locale synchronously when needed
  return useContext(I18nUiContext).uiLocale || 'en';
}
