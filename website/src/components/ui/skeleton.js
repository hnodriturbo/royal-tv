'use client';
// ========================================
// 🎨 Skeleton - Reusable page/container skeleton
// ========================================
// Purpose:
// - Light-weight wrapper used by pages to provide the common outer
//   structure (accounts for sidebar space and allows full-width stretch
//   when sidebar is closed).
// - Minimal styling here (Tailwind classes) and accepts custom classes
//   via props. Uses `clsx` to compose classes.
//
// Props:
// - children: ReactNode - page content
// - className: string - classes for the outer wrapper
// - innerClassName: string - classes for the inner content wrapper
// - sidebarOpen: boolean - when true adds `lg:ml-64` to leave room for sidebar
// - center: boolean - center content vertically/horizontally inside inner wrapper
// - fullWidth: boolean - if true inner wrapper is full width; otherwise constrained
//
// Notes:
// - Keep this file small and dependency-free where possible. We import
//   `clsx` which is commonly present; if not installed, the project will
//   surface an error so you can opt in. We can replace with a tiny helper
//   if you prefer no deps.
// ========================================

import React from 'react';
import clsx from 'clsx';

export default function Skeleton({
  children,
  className = '',
  innerClassName = '',
  sidebarOpen = true,
  center = false,
  fullWidth = false,
  as: Component = 'div',
  ...props
}) {
  // Outer wrapper: preserves the page spacing and optionally reserves
  // horizontal space for a left sidebar on large screens.
  const outer = clsx(
    'flex flex-col w-full mt-4',
    {
      'lg:ml-64': !!sidebarOpen
    },
    className
  );

  // Inner wrapper: constrained container by default; can be full width.
  const inner = clsx(
    fullWidth ? 'w-full' : 'max-w-7xl w-full px-4',
    center ? 'flex flex-col items-center justify-center' : '',
    innerClassName
  );

  return (
    <Component className={outer} {...props}>
      <div className={inner}>{children}</div>
    </Component>
  );
}
