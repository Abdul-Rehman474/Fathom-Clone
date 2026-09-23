import { Bell } from 'lucide-react';

export const metadata = { title: 'Alerts' };

export default function AlertsPage() {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <Bell className="mx-auto size-10 text-text-3" />
      <h1 className="mt-3 text-2xl font-semibold">Keyword alerts</h1>
      <p className="mt-2 text-text-2">
        Get notified when a keyword is mentioned across your calls, with a link to the exact moment.
        Alert management is part of the functional/stretch tier and is being wired up.
      </p>
    </div>
  );
}
