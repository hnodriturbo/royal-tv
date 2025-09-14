// src/components/dev/jsx-dev-runtime.js
/* eslint-env browser, node */
/* eslint-disable no-console */

import * as R from 'react/jsx-dev-runtime-original';

const shouldDebug =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEBUG_INVALID_ELEMENT === '1';

function safeString(x) {
  try {
    return String(x);
  } catch (err) {
    return '[unstringifiable]';
  }
}

function summarizeType(type) {
  try {
    if (typeof type === 'function') return `function ${type.name || '(anonymous)'}`;
    if (typeof type === 'string') return `intrinsic <${type}>`;
    if (type && typeof type === 'object') {
      const name =
        type.displayName || type.name || type.$$typeof || Object.prototype.toString.call(type);
      return `object ${String(name)}`;
    }
    return safeString(type);
  } catch (err) {
    return '<uninspectable>';
  }
}

function check(type, source) {
  if (!shouldDebug) return;
  const ok = typeof type === 'string' || typeof type === 'function';
  if (ok) return;

  const where = source
    ? `${source.fileName ?? ''}:${source.lineNumber ?? ''}:${source.columnNumber ?? ''}`
    : '(no source)';

  let stack = '';
  try {
    throw new Error('Invalid element type (React #130)');
  } catch (err) {
    stack = err && err.stack ? String(err.stack) : '';
  }

  const payload = {
    where,
    typeofType: typeof type,
    summary: summarizeType(type),
    value: type
  };

  console.error('[InvalidElement]', payload, stack);

  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const ev = new CustomEvent('app:dev:invalid-element', { detail: payload });
      window.dispatchEvent(ev);
    }
  } catch (err) {
    console.error('[InvalidElement] Failed to dispatch CustomEvent:', err);
  }
}

// Signature: jsxDEV(type, props, key, isStaticChildren, source, self)
export const Fragment = R.Fragment;
export const jsxDEV = (type, props, key, isStaticChildren, source, self) => {
  check(type, source);
  return R.jsxDEV(type, props, key, isStaticChildren, source, self);
};
