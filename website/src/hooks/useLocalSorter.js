/**
 * useLocalSorter.js
 * ========================================================
 * 🧠 Super-readable sorting hook for arrays in React!
 * - Pass in your array, current sortOrder, and a getSortFunction.
 * - Returns the sorted array, memoized.
 * ========================================================
 */
'use client';

import { useMemo } from 'react';

// data: array to sort
// sortOrder: which sort type (string)
// getSortFunction: function that returns a sort comparator based on sortOrder
export default function useLocalSorter(data, sortOrder, getSortFunction) {
  return useMemo(() => {
    if (!Array.isArray(data)) return [];
    // 📚 Get a sort function based on sortOrder
    const sortFunction = getSortFunction(sortOrder);
    // 🗂️ Sort a copy of the array
    return [...data].sort(sortFunction);
  }, [data, sortOrder, getSortFunction]);
}
