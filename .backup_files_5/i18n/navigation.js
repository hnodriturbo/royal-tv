// NO 'use client' here
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Create typed, locale-aware wrappers
export const { Link, useRouter, usePathname, redirect, getPathname } = createNavigation(routing);

// next-intl's createNavigation doesn't wrap useSearchParams;
// re-export Next.js' version so your imports keep working.
export { useSearchParams } from 'next/navigation';
