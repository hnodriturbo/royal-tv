'use client';
/* eslint-env browser, node */
/* eslint-disable no-console */

import { useEffect } from 'react';

export default function GlobalInvalidElementHints() {
  useEffect(() => {
    const dev = process.env.NODE_ENV !== 'production';
    const enabled = process.env.NEXT_PUBLIC_DEBUG_INVALID_ELEMENT === '1';
    if (!dev || !enabled) return;

    function onCustom(ev) {
      const d = ev && ev.detail ? ev.detail : null;
      const where = d && d.where ? ` at ${d.where}` : '';
      const msg = 'Invalid React element detected.' + (d?.summary ? ` (${d.summary})` : '') + where;
      console.error('[InvalidElement:Hint]', msg);
    }

    window.addEventListener('app:dev:invalid-element', onCustom);

    // Optional: patch console.error for the default React message
    const FLAG = Symbol.for('app.dev.invalidElementPatched');
    const origError = console.error;
    if (!origError[FLAG]) {
      const patched = function (...args) {
        const s = args && args.length > 0 ? String(args[0]) : '';
        if (s.includes('Element type is invalid')) {
          origError(
            '[Hint] React #130 usually means a bad import (default vs named), a circular import, or passing a module object instead of a component.'
          );
        }
        return origError.apply(this, args);
      };
      patched[FLAG] = true;
      origError[FLAG] = true;
      console.error = patched;
    }

    return () => {
      window.removeEventListener('app:dev:invalid-element', onCustom);
      // Don’t bother restoring console.error — in dev HMR it’s safer to leave patched
    };
  }, []);

  return null;
}
