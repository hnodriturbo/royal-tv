// app/[locale]/page.js — SERVER
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import HomeClient from './HomeClient';

export default function LocaleHomePage() {
  return <HomeClient />;
}
