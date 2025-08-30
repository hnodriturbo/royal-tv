// ======================== SortDropdown.js ========================
// Universal sort order dropdown (use for any admin/user list page!)
// - Translated with i18n client via useTranslations()
// Props:
//   - options: Array of { value: 'createdAt_desc', label: 'Newest First' }
//   - value: current selected value
//   - onChange: function to call when changed
// ================================================================

'use client';

import clsx from 'clsx';
import { useTranslations, useLocale } from 'next-intl'; // 🌐 i18n

export default function SortDropdown({ options, value, onChange, className, selectClassName }) {
  const t = useTranslations(); // 🔤

  return (
    <div className={clsx('flex items-center gap-2 w-full justify-center m-0', className)}>
      {/* 🔀 Sort order selector */}
      <label className="font-medium" htmlFor="sort-order">
        {t('components.sortDropdown.sort_label')}
      </label>
      <select
        id="sort-order"
        className={clsx('border rounded p-1 text-sm bg-gray-100 w-full md:w-auto', selectClassName)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={t('components.sortDropdown.sort_aria')}
      >
        {options.map((optionItem) => (
          <option key={optionItem.value} value={optionItem.value}>
            {optionItem.label}
          </option>
        ))}
      </select>
    </div>
  );
}
