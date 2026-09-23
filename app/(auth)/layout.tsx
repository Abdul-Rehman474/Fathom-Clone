import { BrandMark } from '@/components/brand';

/** Auth shell (UI.md §2): dark marketing background, centred logo. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-black">
      <div className="flex justify-center py-8">
        <BrandMark />
      </div>
      <main className="mx-auto grid max-w-5xl gap-10 px-6 pb-16 lg:grid-cols-2 lg:items-center">
        {children}
      </main>
    </div>
  );
}
