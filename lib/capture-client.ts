'use client';

import { createClient } from '@/lib/supabase/client';
import type { Platform } from '@/lib/types';

export async function createCall(input: {
  source: 'upload' | 'tab';
  platform: Platform;
  title?: string;
}): Promise<string> {
  const res = await fetch('/api/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Could not create the call');
  const { id } = await res.json();
  return id as string;
}

async function getUploadUrl(
  callId: string,
  ext: string,
): Promise<{ path: string; token: string; signedUrl: string }> {
  const res = await fetch(`/api/calls/${callId}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ext }),
  });
  if (!res.ok) throw new Error('Could not get an upload URL');
  return res.json();
}

async function completeCall(
  callId: string,
  body: { path: string; duration_sec?: number; media_kind: 'audio' | 'video' },
): Promise<void> {
  const res = await fetch(`/api/calls/${callId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Could not finish the upload');
}

/** Read duration (seconds) from a media file's metadata, client-side. */
export function readMediaDuration(file: Blob): Promise<{ durationSec: number; isVideo: boolean }> {
  return new Promise((resolve) => {
    const isVideo = file.type.startsWith('video');
    const el = document.createElement(isVideo ? 'video' : 'audio');
    el.preload = 'metadata';
    const url = URL.createObjectURL(file);
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({ durationSec: Math.round(el.duration) || 0, isVideo });
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ durationSec: 0, isVideo });
    };
    el.src = url;
  });
}

/** Full upload path: create → sign → direct upload → complete. Returns callId. */
export async function uploadRecording(params: {
  file: Blob;
  ext: string;
  durationSec: number;
  mediaKind: 'audio' | 'video';
  source: 'upload' | 'tab';
  platform: Platform;
  title?: string;
  onProgress?: (pct: number) => void;
}): Promise<string> {
  const supabase = createClient();
  const callId = await createCall({ source: params.source, platform: params.platform, title: params.title });
  params.onProgress?.(10);
  const { path, token } = await getUploadUrl(callId, params.ext);
  params.onProgress?.(25);
  const { error } = await supabase.storage.from('recordings').uploadToSignedUrl(path, token, params.file);
  if (error) throw new Error(`Upload failed: ${error.message}`);
  params.onProgress?.(90);
  await completeCall(callId, {
    path,
    duration_sec: params.durationSec,
    media_kind: params.mediaKind,
  });
  params.onProgress?.(100);
  return callId;
}

/**
 * Upload a finished tab recording into an existing call (the overlay created
 * the call when recording started), reporting real byte progress.
 */
export async function uploadToCall(params: {
  callId: string;
  file: Blob;
  ext: string;
  durationSec: number;
  mediaKind: 'audio' | 'video';
  onProgress?: (pct: number) => void;
}): Promise<void> {
  const { path, signedUrl } = await getUploadUrl(params.callId, params.ext);
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', params.file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) params.onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'));
    xhr.send(params.file);
  });
  await completeCall(params.callId, { path, duration_sec: params.durationSec, media_kind: params.mediaKind });
}
