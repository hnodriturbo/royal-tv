// app/[locale]/faq/page.js  — SERVER (static)
export const dynamic = 'force-dynamic';

import FaqClient from '@/components/ui/faq/faq';

export default function FaqPage() {
  // Server shell stays dumb; no hooks here
  return <FaqClient />;
}
