import type { CallStatus } from '@/lib/types';

/** Ordered pipeline stages for progress display. */
export const PIPELINE_STAGES: CallStatus[] = [
  'recording',
  'uploading',
  'transcribing',
  'summarizing',
  'ready',
];

export const ACTIVE_STATUSES: CallStatus[] = [
  'scheduled',
  'joining',
  'waiting_admit',
  'recording',
  'uploading',
  'transcribing',
  'summarizing',
];

export function isActive(status: CallStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function isTerminal(status: CallStatus): boolean {
  return status === 'ready' || status === 'failed';
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
