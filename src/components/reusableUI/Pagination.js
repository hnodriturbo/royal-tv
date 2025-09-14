'use client';
/**
 * =========================================
 * components/reusableUI/Pagination.js (Client)
 * -------------------------------------------
 * • Shows: first 3, last 3, and a 3-wide window around current page
 * • Inserts ellipses between non-adjacent blocks
 * • For small totals (≤ 7), shows all pages (no ellipses)
 * • Controlled (onPageChange) or Link-based (basePath)
 * =========================================
 */
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Pagination({ currentPage, totalPages, onPageChange, basePath }) {
  const t = useTranslations();

  if (!totalPages || totalPages <= 1) return null;

  const goTo = (p) => {
    if (p < 1 || p > totalPages) return;
    if (onPageChange) onPageChange(p);
  };

  function range(a, b) {
    const res = [];
    for (let i = a; i <= b; i += 1) res.push(i);
    return res;
  }

  function getItems(cp, tp) {
    if (tp <= 7) return range(1, tp);

    const first = range(1, Math.min(3, tp));
    const middleStart = Math.max(1, cp - 1);
    const middleEnd = Math.min(tp, cp + 1);
    const middle = range(middleStart, middleEnd);
    const last = range(Math.max(1, tp - 2), tp);

    const merged = [...first, ...middle, ...last]
      .filter((n, i, arr) => n >= 1 && n <= tp && arr.indexOf(n) === i)
      .sort((a, b) => a - b);

    // Insert ellipses where gaps exist
    const out = [];
    for (let i = 0; i < merged.length; i += 1) {
      const p = merged[i];
      if (i > 0 && p - merged[i - 1] > 1) out.push('dots-' + i);
      out.push(p);
    }
    return out;
  }

  const items = getItems(currentPage, totalPages);

  const PageButton = ({ p }) => (
    <button
      type="button"
      className={`px-3 py-1 rounded ${
        p === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-400 hover:bg-gray-600'
      }`}
      onClick={() => goTo(p)}
      aria-current={p === currentPage ? 'page' : undefined}
    >
      {p}
    </button>
  );

  const PageLink = ({ p }) => (
    <Link
      href={`${basePath}?page=${p}` /* basePath should already include /{locale} if needed */}
      className={`px-3 py-1 rounded ${
        p === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-400 hover:bg-gray-600'
      }`}
      aria-current={p === currentPage ? 'page' : undefined}
    >
      {p}
    </Link>
  );

  const renderItem = (it, idx) => {
    if (typeof it === 'string' && it.startsWith('dots-')) {
      return (
        <li key={it} aria-hidden="true" className="px-2 select-none">
          …
        </li>
      );
    }
    const p = it;
    return <li key={p}>{onPageChange ? <PageButton p={p} /> : <PageLink p={p} />}</li>;
  };

  return (
    <nav aria-label={t('components.pagination.aria_pagination')}>
      <ul className="flex items-center gap-2">
        {onPageChange ? (
          <button
            type="button"
            className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded disabled:opacity-50"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label={t('components.pagination.previous')}
          >
            ←
          </button>
        ) : (
          <Link
            href={`${basePath}?page=${Math.max(1, currentPage - 1)}`}
            className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded aria-disabled:opacity-50"
            aria-disabled={currentPage <= 1}
            aria-label={t('components.pagination.previous')}
            tabIndex={currentPage <= 1 ? -1 : 0}
          >
            ←
          </Link>
        )}

        {items.map(renderItem)}

        {onPageChange ? (
          <button
            type="button"
            className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded disabled:opacity-50"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label={t('components.pagination.next')}
          >
            →
          </button>
        ) : (
          <Link
            href={`${basePath}?page=${Math.min(totalPages, currentPage + 1)}`}
            className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded aria-disabled:opacity-50"
            aria-disabled={currentPage >= totalPages}
            aria-label={t('components.pagination.next')}
            tabIndex={currentPage >= totalPages ? -1 : 0}
          >
            →
          </Link>
        )}
      </ul>
    </nav>
  );
}
