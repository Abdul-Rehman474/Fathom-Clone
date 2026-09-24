import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthPanel } from '@/components/auth/auth-panel';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthPanel mode="signin" />
    </Suspense>
  );
}
