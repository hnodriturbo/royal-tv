// src/lib/jsx-debug-runtime.js
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime';
import { isValidElement } from 'react';

function validateChildren(type, props) {
  const ch = props?.children;
  if (ch && typeof ch === 'object' && !Array.isArray(ch) && !isValidElement(ch)) {
    console.error('🚨 Object child rendered', {
      tag: typeof type === 'string' ? type : type?.name || 'Component',
      keys: Object.keys(ch).slice(0, 5)
    });
    throw new Error(
      'Object child at <' + (typeof type === 'string' ? type : type?.name || 'Component') + '>'
    );
  }
}

export function jsx(type, props, key) {
  validateChildren(type, props);
  return _jsx(type, props, key);
}

export function jsxs(type, props, key) {
  validateChildren(type, props);
  return _jsxs(type, props, key);
}

// ✅ Just re-export Fragment directly
export { _Fragment as Fragment };
