// ======================== SortDropdown.js ========================
// Universal sort order dropdown (use for any admin/user list page!)
// Props:
//   - options: Array of { value: 'createdAt_desc', label: 'Newest First' }
//   - value: current selected value
//   - onChange: function to call when changed
// ================================================================

import clsx from 'clsx';
export default function SortDropdown({ options, value, onChange, className, selectClassName }) {
  return (
    <div className={clsx('flex items-center gap-2 w-full justify-center m-0', className)}>
      {/* 🔀 Sort order selector */}
      <label className="font-medium" htmlFor="sort-order">
        Sort:
      </label>
      <select
        id="sort-order"
        className={clsx('border rounded p-1 text-sm bg-gray-100 w-full md:w-auto', selectClassName)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
