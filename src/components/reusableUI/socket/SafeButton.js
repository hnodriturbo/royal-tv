/**
 * SafeButton.js
 * ================================
 * 🛡️ Zero-tolerance <button> wrapper for React #130
 * - Forces type="button" to avoid accidental form submits
 * - Ensures onClick is a function (wraps non-functions defensively)
 * - Coerces title/aria-label to strings
 * - Sanitizes children so no object/promise/undefined lands in JSX
 * - Keeps all incoming className/styling intact
 */

'use client';

import React from 'react';

export default function SafeButton({
  // 🎛️ public props (keep names long and descriptive)
  onClick: rawOnClick,
  title: rawTitle,
  ariaLabel: rawAriaLabel,
  className,
  style,
  disabled,
  children,
  ...otherProps
}) {
  // 🧠 ensure onClick is always a function (arrow wraps accidental values)
  const safeOnClick =
    typeof rawOnClick === 'function'
      ? rawOnClick
      : () => {
          // 🤐 no-op; prevents React from trying to render function return
        };

  // 🧼 coerce attributes that must be strings
  const safeTitle = rawTitle == null ? undefined : String(rawTitle);
  const safeAriaLabel = rawAriaLabel == null ? (safeTitle ?? undefined) : String(rawAriaLabel);

  const renderSafeChildren = (value) => {
    if (React.isValidElement(value)) return value;
    if (['string', 'number', 'boolean'].includes(typeof value)) return String(value);
    if (Array.isArray(value))
      return value.map((child, i) => (
        <React.Fragment key={i}>{renderSafeChildren(child)}</React.Fragment>
      ));
    return '';
  };

  return (
    <button
      type="button" // ✅ never submit
      onClick={safeOnClick}
      className={className}
      style={style}
      title={safeTitle}
      aria-label={safeAriaLabel}
      disabled={disabled}
      {...otherProps}
    >
      {/* 🧷 children are always safe now */}
      {renderSafeChildren(children)}
    </button>
  );
}
