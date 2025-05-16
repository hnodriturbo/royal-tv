'use client';
import Link from 'next/link';

const Pagination = ({ currentPage, totalPages, basePath, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Create an array of page numbers
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex justify-center mt-4">
      <ul className="flex space-x-2">
        {currentPage > 1 && (
          <li>
            {onPageChange ? (
              <button
                onClick={() => onPageChange(currentPage - 1)}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
              >
                Previous
              </button>
            ) : (
              <Link href={`${basePath}?page=${currentPage - 1}`}>
                <button className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">
                  Previous
                </button>
              </Link>
            )}
          </li>
        )}
        {pages.map((page) => (
          <li key={page}>
            {onPageChange ? (
              <button
                onClick={() => onPageChange(page)}
                className={`px-4 py-2 ${
                  page === currentPage
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-400 hover:bg-gray-600'
                } rounded`}
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
                >
                  {page}
                </button>
              </Link>
            )}
          </li>
        ))}
        {currentPage < totalPages && (
          <li>
            {onPageChange ? (
              <button
                onClick={() => onPageChange(currentPage + 1)}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded"
              >
                Next
              </button>
            ) : (
              <Link href={`${basePath}?page=${currentPage + 1}`}>
                <button className="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">
                  Next
                </button>
              </Link>
            )}
          </li>
        )}
      </ul>
    </div>
  );
};

export default Pagination;
