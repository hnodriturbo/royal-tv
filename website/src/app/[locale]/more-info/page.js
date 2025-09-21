// app/[locale]/more-info/page.js  — SERVER (static)
export const dynamic = 'force-dynamic';

import MoreInfoClient from '@/components/ui/moreInfo/MoreInfo';

export default function MoreInfoPage() {
  // Server shell stays dumb; no hooks here
  return <MoreInfoClient />;
}
