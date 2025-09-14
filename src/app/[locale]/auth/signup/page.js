// app/[locale]/more-info/page.js  — SERVER (static)
export const dynamic = 'force-dynamic';

import SignupClient from '@/components/ui/signup/SignUp';

export default function SignUpPage() {
  // Server shell stays dumb; no hooks here
  return <SignupClient />;
}
