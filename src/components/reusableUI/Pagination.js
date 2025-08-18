/**
 * ===========================================
 * ⏩ Pagination Component (Smart Shortening)
 * - Translated with i18n client via useT()
 * ===========================================
 * - Shows: first page, ..., up to 3 before/after, ..., last page
 * - Always highlights current page
 * - ... means skipped pages, click to go to first/last
 */

'use client';
import { Link } from '@/lib/language';
import { useT } from '@/lib/i18n/client'; // 🌐 i18n

const Pagination = ({ currentPage, totalPages, basePath, onPageChange }) => {
  const t = useT(); // 🔤

  if (totalPages <= 1) return null;

  // 🧮 Helper to go to a given page
  const goTo = (page) => {
    onPageChange ? onPageChange(page) : (window.location.href = `${basePath}?page=${page}`);
  };

  // 🧩 Build pages to display
  let pagesToShow = [];

  // 🏁 Show first page if needed
  if (currentPage > 3) pagesToShow.push(1);

  // … Left ellipsis if gap
  if (currentPage > 4) pagesToShow.push('left-ellipsis');

  // 👈 Up to 2 pages before current
  for (let index = Math.max(2, currentPage - 2); index < currentPage; index++) {
    pagesToShow.push(index);
  }

  // 🔵 Current page
  pagesToShow.push(currentPage);

  // 👉 Up to 2 pages after current
  for (let index = currentPage + 1; index <= Math.min(totalPages - 1, currentPage + 2); index++) {
    pagesToShow.push(index);
  }

  // … Right ellipsis if gap
  if (currentPage < totalPages - 3) pagesToShow.push('right-ellipsis');

  // 🏁 Show last page if needed
  if (currentPage < totalPages - 2) pagesToShow.push(totalPages);

  return (
    <div className="flex justify-center mt-4">
      <ul className="flex space-x-2" aria-label={t('components.pagination.aria_pagination')}>
        {/* ⬅️ Previous button, but show '1' if next would be page 1 */}
        {currentPage > 1 && (
          <li>
            {currentPage - 1 === 1 ? (
              onPageChange ? (
                <button
                  onClick={() => goTo(1)}
                  className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
                  aria-label={t('components.pagination.aria_go_to_page', { page: 1 })}
                >
                  1
                </button>
              ) : (
                <Link
                  href={`${basePath}?page=1`}
                  aria-label={t('components.pagination.aria_go_to_page', { page: 1 })}
                >
                  <button className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">1</button>
                </Link>
              )
            ) : onPageChange ? (
              <button
                onClick={() => goTo(currentPage - 1)}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
                aria-label={t('components.pagination.previous')}
              >
                ←
              </button>
            ) : (
              <Link
                href={`${basePath}?page=${currentPage - 1}`}
                aria-label={t('components.pagination.previous')}
              >
                <button className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">←</button>
              </Link>
            )}
          </li>
        )}

        {/* 🔢 Page buttons & ellipses */}
        {pagesToShow.map((page, index) =>
          page === 'left-ellipsis' || page === 'right-ellipsis' ? (
            <li
              key={`${page}-${index}`}
              className="px-2 py-2 text-gray-500 select-none"
              aria-hidden
            >
              …
            </li>
          ) : (
            <li key={page}>
              {onPageChange ? (
                <button
                  onClick={() => goTo(page)}
                  className={`px-4 py-2 ${
                    page === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-400 hover:bg-gray-600'
                  } rounded`}
                  disabled={page === currentPage}
                  aria-current={page === currentPage ? 'page' : undefined}
                  aria-label={t('components.pagination.aria_go_to_page', { page })}
                >
                  {page}
                </button>
              ) : (
                <Link
                  href={`${basePath}?page=${page}`}
                  aria-label={t('components.pagination.aria_go_to_page', { page })}
                >
                  <button
                    className={`px-4 py-2 ${
                      page === currentPage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-400 hover:bg-gray-600'
                    } rounded`}
                    disabled={page === currentPage}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                </Link>
              )}
            </li>
          )
        )}
        {/* ➡️ Next button, but show last page number if next is the last */}
        {currentPage < totalPages && (
          <li>
            {currentPage + 1 === totalPages ? (
              onPageChange ? (
                <button
                  onClick={() => goTo(totalPages)}
                  className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
                  aria-label={t('components.pagination.aria_go_to_page', { page: totalPages })}
                >
                  {totalPages}
                </button>
              ) : (
                <Link
                  href={`${basePath}?page=${totalPages}`}
                  aria-label={t('components.pagination.aria_go_to_page', { page: totalPages })}
                >
                  <button className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">
                    {totalPages}
                  </button>
                </Link>
              )
            ) : onPageChange ? (
              <button
                onClick={() => goTo(currentPage + 1)}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
                aria-label={t('components.pagination.next')}
              >
                →
              </button>
            ) : (
              <Link
                href={`${basePath}?page=${currentPage + 1}`}
                aria-label={t('components.pagination.next')}
              >
                <button className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">→</button>
              </Link>
            )}
          </li>
        )}
      </ul>
    </div>
  );
};

export default Pagination;
