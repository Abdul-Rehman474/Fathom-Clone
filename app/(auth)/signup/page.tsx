import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthPanel, AuthQuote } from '@/components/auth/auth-panel';

export const metadata: Metadata = { title: 'Sign up free' };

export default function SignupPage() {
  return (
    <>
      <Suspense>
        <AuthPanel mode="signup" />
      </Suspense>
      <AuthQuote />
    </>
  );
}
