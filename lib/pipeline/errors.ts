/**
 * Turns a stored pipeline error into something a person can act on
 * (PRD §8 reliability). Raw provider messages never reach the UI.
 */
export interface FailureInfo {
  /** Which service failed, in plain words. */
  cause: string;
  /** What to do about it. */
  hint: string;
  /** Whether pressing Retry can plausibly fix it. */
  retryable: boolean;
}

export function describeFailure(stage: string | null, error: string | null): FailureInfo {
  const msg = error ?? '';
  const summary = stage === 'summarizing';

  if (/DEEPGRAM_API_KEY is missing|Deepgram( or site URL)? not configured/i.test(msg)) {
    return {
      cause: 'Transcription is not set up on this server.',
      hint: 'Add a Deepgram key to the server settings, then retry.',
      retryable: true,
    };
  }
  if (/GROQ_API_KEY/i.test(msg)) {
    return {
      cause: 'Summaries are not set up on this server.',
      hint: 'Add a Groq key to the server settings, then retry.',
      retryable: true,
    };
  }
  if (/media URL|recording file/i.test(msg)) {
    return {
      cause: 'The recording file could not be reached.',
      hint: 'The meeting provider may still be preparing it. Retry in a minute.',
      retryable: true,
    };
  }
  if (/No transcript|no speech/i.test(msg)) {
    return {
      cause: 'No speech was found in this recording.',
      hint: 'Check that the recording has audio. Retrying will not change the result.',
      retryable: false,
    };
  }
  if (/\b429\b|rate.?limit/i.test(msg)) {
    return {
      cause: summary ? 'The summary service is busy right now.' : 'The transcription service is busy right now.',
      hint: 'Wait a minute, then retry.',
      retryable: true,
    };
  }
  if (/timed? ?out|abort/i.test(msg)) {
    return {
      cause: summary ? 'The summary took too long.' : 'Transcription took too long.',
      hint: 'Retry. Long recordings sometimes need a second attempt.',
      retryable: true,
    };
  }
  if (/Deepgram/i.test(msg)) {
    return {
      cause: 'The transcription service returned an error.',
      hint: 'Retry. If it keeps failing, the file format may not be supported.',
      retryable: true,
    };
  }
  if (/Groq/i.test(msg)) {
    return {
      cause: 'The summary service returned an error.',
      hint: 'Retry. Your transcript is saved, so only the summary runs again.',
      retryable: true,
    };
  }
  return {
    cause: summary ? 'Something went wrong while writing the summary.' : 'Something went wrong during transcription.',
    hint: 'Retrying resumes from that step.',
    retryable: true,
  };
}
