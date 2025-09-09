// File: components/reusableUI/Pagination.js
'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Pagination({ currentPage, totalPages, onPageChange, basePath }) {
  const t = useTranslations();

  if (!totalPages || totalPages <= 1) return null;

  const goTo = (p) => {
    if (p < 1 || p > totalPages) return;
    onPageChange?.(p);
  };

  const pageItem = (p) => (
    <li key={p}>
      {onPageChange ? (
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
      ) : (
        <Link
          href={`${basePath}?page=${p}`}
          className={`px-3 py-1 rounded ${
            p === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-400 hover:bg-gray-600'
          }`}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </Link>
      )}
    </li>
  );

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label={t('components.pagination.aria_label')}>
      <ul className="flex items-center gap-2">
        {onPageChange ? (
          <button
            type="button"
            className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label={t('components.pagination.previous')}
          >
            ←
          </button>
        ) : (
          <Link
            href={`${basePath}?page=${Math.max(1, currentPage - 1)}`}
            className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
            aria-disabled={currentPage <= 1}
            aria-label={t('components.pagination.previous')}
          >
            ←
          </Link>
        )}

        {pages.map(pageItem)}

        {onPageChange ? (
          <button
            type="button"
            className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label={t('components.pagination.next')}
          >
            →
          </button>
        ) : (
          <Link
            href={`${basePath}?page=${Math.min(totalPages, currentPage + 1)}`}
            className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
            aria-disabled={currentPage >= totalPages}
            aria-label={t('components.pagination.next')}
          >
            →
          </Link>
        )}
      </ul>
    </nav>
  );
}
