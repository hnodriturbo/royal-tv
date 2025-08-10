/**
 * ===========================================
 * ⏩ Pagination Component (Smart Shortening)
 * ===========================================
 * - Shows: first page, ..., up to 3 before/after, ..., last page
 * - Always highlights current page
 * - ... means skipped pages, click to go to first/last
 */

'use client';
import Link from 'next/link';

const Pagination = ({ currentPage, totalPages, basePath, onPageChange }) => {
  if (totalPages <= 1) return null;

  // 🧮 Helper to go to a given page
  const goTo = (page) => {
    onPageChange ? onPageChange(page) : (window.location.href = `#{basePath}?page=${page}`);
  };

  // 🧩 Build pages to display
  let pagesToShow = [];

  // 🏁 Show first page if needed
  if (currentPage > 3) pagesToShow.push(1);

  // … Left ellipsis if gap
  if (currentPage > 4) pagesToShow.push('left-ellipsis');

  // 👈 Up to 2 pages before current
  for (let i = Math.max(2, currentPage - 2); i < currentPage; i++) {
    pagesToShow.push(i);
  }

  // 🔵 Current page
  pagesToShow.push(currentPage);

  // 👉 Up to 2 pages after current
  for (let i = currentPage + 1; i <= Math.min(totalPages - 1, currentPage + 2); i++) {
    pagesToShow.push(i);
  }

  // … Right ellipsis if gap
  if (currentPage < totalPages - 3) pagesToShow.push('right-ellipsis');

  // 🏁 Show last page if needed
  if (currentPage < totalPages - 2) pagesToShow.push(totalPages);

  /* const pages = Array.from({ length: totalPages }, (_, index) => index + 1); */

  return (
    <div className="flex justify-center mt-4">
      <ul className="flex space-x-2">
        {/* ⬅️ Previous button, but show '1' if next would be page 1 */}
        {currentPage > 1 && (
          <li>
            {currentPage - 1 === 1 ? (
              onPageChange ? (
                <button
                  onClick={() => goTo(1)}
                  className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
                >
                  1
                </button>
              ) : (
                <Link href={`${basePath}?page=1`}>
                  <button className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">1</button>
                </Link>
              )
            ) : onPageChange ? (
              <button
                onClick={() => goTo(currentPage - 1)}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
              >
                ←
              </button>
            ) : (
              <Link href={`${basePath}?page=${currentPage - 1}`}>
                <button className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">←</button>
              </Link>
            )}
          </li>
        )}

        {/* 🔢 Page buttons & ellipses */}
        {pagesToShow.map((page, idx) =>
          page === 'left-ellipsis' || page === 'right-ellipsis' ? (
            <li key={page + idx} className="px-2 py-2 text-gray-500 select-none">
              ...
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
                >
                  {page}
                </button>
              ) : (
                <Link href={`${basePath}?page=${page}`}>
                  <button
                    className={`px-4 py-2 ${
                      page === currentPage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-400 hover:bg-gray-600'
                    } rounded`}
                    disabled={page === currentPage}
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
                >
                  {totalPages}
                </button>
              ) : (
                <Link href={`${basePath}?page=${totalPages}`}>
                  <button className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">
                    {totalPages}
                  </button>
                </Link>
              )
            ) : onPageChange ? (
              <button
                onClick={() => goTo(currentPage + 1)}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
              >
                →
              </button>
            ) : (
              <Link href={`${basePath}?page=${currentPage + 1}`}>
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
