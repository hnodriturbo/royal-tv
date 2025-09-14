export const dynamic = 'force-dynamic';

import MiddlePage from '@/components/ui/middlePage/MiddlePage'; // client; handles redirect
console.log(typeof MiddlePage);
export default function Page() {
  return <MiddlePage />;
}
