import { MSection } from '@/components/marketing/blocks';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <MSection className="!pt-20">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-text-3">Sample policy for a demo application.</p>
        <div className="mt-8 space-y-6 text-text-2">
          {[
            ['What we store', 'Your profile, settings, recordings, transcripts and summaries, visible only to your account by row-level security.'],
            ['How recordings are handled', 'Media is kept in private storage and served through short-lived signed URLs.'],
            ['AI processing', 'Transcripts are sent to transcription and language-model providers to generate summaries and answers.'],
            ['Your control', 'You can delete any call, and deleting your account removes your data, files and login.'],
            ['Consent', 'You are responsible for collecting attendee consent before recording.'],
          ].map(([h, b]) => (
            <section key={h}>
              <h2 className="text-lg font-semibold text-text-1">{h}</h2>
              <p className="mt-1">{b}</p>
            </section>
          ))}
        </div>
      </article>
    </MSection>
  );
}
