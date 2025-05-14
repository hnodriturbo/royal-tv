/**
 * ReusableTable component
 * -----------------------
 * A flexible, responsive table for desktop and card view for mobile.
 *
 * Props:
 *  • columns            – Array of { key, title, dataIndex } defining table headers and data fields.
 *  • data               – Array of row objects to render.
 *  • actionsRenderer    – Function(row) returning JSX for action buttons in each row.
 *  • enableActionColumn – Boolean to toggle rendering of the "Actions" column/cards.
 *  • enablePagination   – Boolean to toggle rendering of the pagination controls.
 *  • currentPage        – Current page number for pagination.
 *  • totalPages         – Total page count for pagination.
 *  • onPageChange       – Callback(newPage) when the page is changed.
 */
import React from 'react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination'; // Tailwind-styled pagination component

const ReusableTable = ({
  columns,
  data,
  actionsRenderer,
  enableActionColumn = true,
  enablePagination = true,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <>
      {/* Desktop: Scrollable table */}
      <div className="overflow-x-auto w-full pc:block mobile:hidden">
        <table className="w-full border-collapse border border-gray-300">
          {/* Table Header */}
          <thead>
            <tr className="border-b-2 bg-gray-600">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border border-gray-300 px-4 py-2 text-left text-white"
                >
                  {column.title}
                  {/* Column title */}
                </th>
              ))}
              {enableActionColumn && (
                <th className="border border-gray-300 px-4 py-2 text-left text-white">
                  Actions{/* Actions header */}
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="text-center hover:divide-y hover:divide-gray-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-100">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="border border-gray-300 px-4 py-2"
                  >
                    {row[column.dataIndex] /* Cell data */}
                  </td>
                ))}
                {enableActionColumn && (
                  <td className="border border-gray-300 px-4 py-2 flex gap-2 justify-center">
                    {actionsRenderer(row) /* Render custom action buttons */}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card view */}
      <div className="mobile:flex pc:hidden flex-col gap-4 w-full mt-4">
        {data.map((row) => (
          <div
            key={row.id}
            className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white"
          >
            {columns.map((column) => (
              <p key={column.key} className="mb-2">
                <strong>{column.title}:</strong> {row[column.dataIndex]}
                {/* Field label + value */}
              </p>
            ))}
            {enableActionColumn && (
              <div className="flex flex-wrap gap-2 mt-3 justify-end">
                {actionsRenderer(row) /* Action buttons */}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {enablePagination && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
};

export default ReusableTable;
