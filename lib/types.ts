/** Shared domain types, mirroring the Postgres schema (architecture.md §5). */

export type CallStatus =
  | 'scheduled'
  | 'joining'
  | 'waiting_admit'
  | 'recording'
  | 'uploading'
  | 'transcribing'
  | 'summarizing'
  | 'ready'
  | 'failed';

export type Platform = 'meet' | 'zoom' | 'teams' | 'upload' | 'browser';
export type CallSource = 'bot' | 'tab' | 'upload';
export type Visibility = 'private' | 'workspace';
export type MediaKind = 'video' | 'audio';
export type AccountType = 'personal' | 'team';
export type ShareAccess = 'link' | 'workspace' | 'private';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  department: string | null;
  role: string | null;
  usage: 'solo' | 'team' | null;
  onboarding_step: number;
  onboarding_done: boolean;
  invite_code: string;
  credits: number;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  bot_name: string | null;
  auto_record: string | null;
  auto_share: string | null;
  notes_on: string | null;
  share_with: string | null;
  auto_action_items: boolean;
  default_template: string;
  recording_banner: boolean;
  auto_consent: boolean;
  default_share_access: ShareAccess;
  in_meeting_chat: boolean;
  anonymized_data: boolean;
  zoom_auto_unscheduled: boolean | null;
  meet_auto_unscheduled: boolean | null;
  enhanced_recording: boolean | null;
}

export interface Call {
  id: string;
  owner_id: string;
  workspace_id: string | null;
  visibility: Visibility;
  title: string | null;
  platform: Platform;
  source: CallSource;
  meeting_url: string | null;
  bot_id: string | null;
  transcript_job_id: string | null;
  status: CallStatus;
  failed_stage: string | null;
  error: string | null;
  scheduled_at: string | null;
  recording_started_at: string | null;
  started_at: string | null;
  duration_sec: number | null;
  media_path: string | null;
  media_kind: MediaKind | null;
  thumbnail_path: string | null;
  template: string | null;
  scratchpad: string | null;
  share_token: string | null;
  share_access: ShareAccess | null;
  created_at: string;
  updated_at: string;
}

export interface Attendee {
  id: string;
  call_id: string;
  name: string;
  email: string | null;
  speaker_label: string | null;
}

export interface TranscriptSegment {
  id: string;
  call_id: string;
  idx: number;
  speaker_label: string | null;
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface ActionItem {
  id: string;
  call_id: string;
  text: string;
  assignee: string | null;
  start_ms: number | null;
  done: boolean;
  position: number;
}

export interface HighlightTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
}

export interface Highlight {
  id: string;
  call_id: string;
  tag_id: string;
  created_by: string;
  start_ms: number;
  end_ms: number | null;
  note: string | null;
  source: 'user' | 'overlay' | 'ai';
}

export interface Playlist {
  id: string;
  owner_id: string;
  workspace_id: string | null;
  title: string;
  description: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

/** Structured summary payload (architecture.md §4.1). */
export interface SummaryTopic {
  title: string;
  bullets: { text: string; start_ms: number | null }[];
}
export interface SummaryContent {
  title: string;
  overview: string;
  purpose: string;
  key_takeaways: string[];
  topics: SummaryTopic[];
  decisions: { text: string; start_ms: number | null }[];
  action_items: { text: string; assignee: string | null; start_ms: number | null }[];
  next_steps: string[];
  questions: string[];
  deepgram?: { short?: string; topics?: string[] };
}

export interface Summary {
  call_id: string;
  template: string;
  content: SummaryContent;
  overview: string | null;
  model: string | null;
  created_at: string;
}
