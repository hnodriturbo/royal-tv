/**
 * SafeButton.js — defensive <button> wrapper
 */
'use client';

import React from 'react';

export default function SafeButton({
  onClick: rawOnClick,
  title: rawTitle,
  ariaLabel: rawAriaLabel,
  className,
  style,
  disabled,
  children,
  ...otherProps
}) {
  const safeOnClick = typeof rawOnClick === 'function' ? rawOnClick : () => {};
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
      type="button"
      onClick={safeOnClick}
      className={className}
      style={style}
      title={safeTitle}
      aria-label={safeAriaLabel}
      disabled={disabled}
      {...otherProps}
    >
      {renderSafeChildren(children)}
    </button>
  );
}
