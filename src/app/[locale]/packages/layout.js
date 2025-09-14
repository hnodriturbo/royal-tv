// app/[locale]/packages/layout.js
// Server file (no 'use client')
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function PackagesLayout({ children }) {
  return children;
}
