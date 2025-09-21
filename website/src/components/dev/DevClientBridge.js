// src/components/dev/DevClientBridge.js
'use client';

import GlobalInvalidElementHints from './GlobalInvalidElementHints';

export default function DevClientBridge() {
  // No hook / no providers — always safe
  return <GlobalInvalidElementHints />;
}
