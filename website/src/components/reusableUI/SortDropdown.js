'use client';

import clsx from 'clsx';
import { useTranslations } from 'next-intl';

export default function SortDropdown({
  options = [],
  value,
  onChange,
  className,
  selectClassName
}) {
  const t = useTranslations();

  return (
    <div className={clsx('flex items-center gap-2 w-full justify-center m-0', className)}>
      <label className="font-medium" htmlFor="sort-order">
        {t('components.sortDropdown.sort_label')}
      </label>
      <select
        id="sort-order"
        className={clsx('border rounded p-1 text-sm bg-gray-100 w-full md:w-auto', selectClassName)}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label={t('components.sortDropdown.sort_aria')}
        disabled={!options.length}
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
