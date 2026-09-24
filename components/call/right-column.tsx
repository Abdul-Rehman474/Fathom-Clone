'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Share2, MoreVertical, Plus, Trash2, Check, Copy, ListPlus } from 'lucide-react';
import type { Attendee, ActionItem, Highlight, HighlightTag, Call } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AssigneeChip, TimestampChip } from '@/components/ui/chips';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toaster';
import { formatDate, secToDurationLabel, msToClock } from '@/lib/time';

const ACCESS_LABEL = {
  link: 'Anyone with the link can view',
  workspace: 'Workspace members',
  private: 'Only me',
} as const;

const PLATFORM_LABEL: Record<Call['platform'], string> = {
  meet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  upload: 'Upload',
  browser: 'Tab recording',
};
import {
  updateTitle,
  renameSpeaker,
  toggleActionItem,
  addActionItem,
  deleteActionItem,
  addHighlight,
  deleteHighlight,
  setShareAccess,
  regenerateShareToken,
  setVisibility,
  deleteCall,
} from '@/app/(app)/calls/[id]/actions';
import { addToPlaylist, createPlaylistWithHighlight } from '@/app/(app)/playlists/actions';

export function RightColumn({
  call,
  attendees,
  actionItems,
  highlights,
  tags,
  playlists,
  currentMs,
  onSeek,
}: {
  call: Call;
  attendees: Attendee[];
  actionItems: ActionItem[];
  highlights: Highlight[];
  tags: HighlightTag[];
  playlists: { id: string; title: string }[];
  currentMs: number;
  onSeek: (ms: number) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(call.title ?? '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [newItem, setNewItem] = useState('');
  const tagById = new Map(tags.map((t) => [t.id, t]));

  async function saveTitle() {
    setEditingTitle(false);
    if (title !== call.title) {
      await updateTitle(call.id, title);
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      {/* Title + meta */}
      <div>
        {editingTitle ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              onBlur={saveTitle}
            />
          </div>
        ) : (
          <button onClick={() => setEditingTitle(true)} className="group flex items-start gap-2 text-left">
            <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight">{call.title ?? 'Untitled recording'}</h1>
            <Pencil className="mt-1 size-4 shrink-0 text-text-3 opacity-0 group-hover:opacity-100" />
          </button>
        )}
        <p className="mt-1 text-sm text-text-3 tnum">
          {formatDate(call.created_at)} · {secToDurationLabel(call.duration_sec)} ·{' '}
          {PLATFORM_LABEL[call.platform]}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <SharePopover call={call} />
          <OverflowMenu call={call} />
        </div>
      </div>

      {/* Attendees */}
      <Panel title="Attendees">
        {attendees.length === 0 ? (
          <Empty>No attendees yet</Empty>
        ) : (
          attendees.map((a) => <AttendeeRow key={a.id} callId={call.id} attendee={a} onDone={() => router.refresh()} />)
        )}
      </Panel>

      {/* Action items */}
      <Panel title={`Action items  ${actionItems.filter((a) => a.done).length}/${actionItems.length}`}>
        {actionItems.map((item) => (
          <div key={item.id} className="group flex items-start gap-2 py-1">
            <Checkbox
              defaultChecked={item.done}
              onCheckedChange={(v) => toggleActionItem(call.id, item.id, v === true)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm text-text-1">{item.text}</p>
              <div className="mt-0.5 flex items-center gap-2">
                {item.start_ms != null && <TimestampChip ms={item.start_ms} onSeek={onSeek} />}
                {item.assignee && <AssigneeChip name={item.assignee} />}
              </div>
            </div>
            <button
              onClick={async () => {
                await deleteActionItem(call.id, item.id);
                router.refresh();
              }}
              className="text-text-3 transition-colors hover:text-danger lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="Delete action item"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        <div className="mt-2 flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add action item"
            className="h-8"
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && newItem.trim()) {
                await addActionItem(call.id, newItem.trim());
                setNewItem('');
                router.refresh();
              }
            }}
          />
        </div>
      </Panel>

      {/* Scratchpad from the in-meeting overlay (FR-4.2) */}
      {call.scratchpad?.trim() && (
        <Panel title="Your notes">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-2">{call.scratchpad}</p>
        </Panel>
      )}

      {/* Highlights */}
      <Panel title="Highlights">
        <AddHighlight callId={call.id} tags={tags} currentMs={currentMs} onDone={() => router.refresh()} />
        {highlights.length === 0 ? (
          <Empty>No highlights yet</Empty>
        ) : (
          highlights.map((h) => {
            const tag = h.tag_id ? tagById.get(h.tag_id) : undefined;
            return (
              <div key={h.id} className="group flex items-start gap-2 py-1">
                <span className="mt-1 size-3 shrink-0 rounded-[3px]" style={{ backgroundColor: tag?.color ?? '#6F756D' }} />
                <div className="flex-1">
                  <p className="text-sm text-text-2">{h.note ?? tag?.name}</p>
                  <TimestampChip ms={h.start_ms} onSeek={onSeek} />
                </div>
                <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100">
                  <AddToPlaylistButton highlightId={h.id} playlists={playlists} onDone={() => router.refresh()} />
                  <button
                    onClick={async () => {
                      await deleteHighlight(call.id, h.id);
                      router.refresh();
                    }}
                    className="text-text-3 hover:text-danger"
                    aria-label="Delete highlight"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="micro-label mb-3 border-b border-border pb-2">{title}</h2>
      <div>{children}</div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text-3">{children}</p>;
}

function AttendeeRow({ callId, attendee, onDone }: { callId: string; attendee: Attendee; onDone: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(attendee.name);
  return (
    <div className="flex items-center gap-2 py-1">
      <Avatar name={name} size={24} />
      {editing ? (
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={async () => {
            setEditing(false);
            await renameSpeaker(callId, attendee.id, name);
            onDone();
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="h-7"
        />
      ) : (
        <button onClick={() => setEditing(true)} className="group flex flex-1 items-center gap-1 text-left text-sm">
          {name}
          {attendee.speaker_label && attendee.speaker_label !== name && (
            <span className="text-xs text-text-3">({attendee.speaker_label})</span>
          )}
          <Pencil className="size-3 text-text-3 opacity-0 group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}

function AddHighlight({
  callId,
  tags,
  currentMs,
  onDone,
}: {
  callId: string;
  tags: HighlightTag[];
  currentMs: number;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tagId, setTagId] = useState(tags[0]?.id ?? '');
  const [note, setNote] = useState('');
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" className="mb-2 w-full">
          <Plus /> Highlight at {msToClock(currentMs)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-2">
        <Select value={tagId} onValueChange={setTagId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tag">{tags.find((t) => t.id === tagId)?.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
        <Button
          size="sm"
          className="w-full"
          onClick={async () => {
            if (!tagId) return;
            await addHighlight(callId, tagId, Math.round(currentMs), note);
            setNote('');
            setOpen(false);
            onDone();
            toast.success(`Highlighted at ${msToClock(currentMs)}`);
          }}
        >
          Add highlight
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function AddToPlaylistButton({
  highlightId,
  playlists,
  onDone,
}: {
  highlightId: string;
  playlists: { id: string; title: string }[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="text-text-3 hover:text-cyan" aria-label="Add to playlist">
          <ListPlus className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 space-y-1">
        <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-text-3">Add to playlist</p>
        {playlists.map((p) => (
          <button
            key={p.id}
            onClick={async () => {
              await addToPlaylist(p.id, highlightId);
              setOpen(false);
              onDone();
              toast.success(`Added to ${p.title}`);
            }}
            className="block w-full rounded-btn px-2 py-1.5 text-left text-sm hover:bg-surface-3"
          >
            {p.title}
          </button>
        ))}
        <div className="flex gap-1 pt-1">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New playlist" className="h-8" />
          <Button
            size="sm"
            onClick={async () => {
              if (!newName.trim()) return;
              await createPlaylistWithHighlight(newName.trim(), highlightId);
              setNewName('');
              setOpen(false);
              onDone();
              toast.success('Playlist created');
            }}
          >
            Add
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SharePopover({ call }: { call: Call }) {
  const router = useRouter();
  const [access, setAccess] = useState(call.share_access ?? 'private');
  const link =
    typeof window !== 'undefined' && call.share_token
      ? `${window.location.origin}/share/${call.share_token}`
      : '';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="secondary">
          <Share2 /> Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3">
        <Select
          value={access}
          onValueChange={async (v) => {
            setAccess(v as never);
            await setShareAccess(call.id, v as never);
            router.refresh();
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{ACCESS_LABEL[access as keyof typeof ACCESS_LABEL]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="link">Anyone with the link can view</SelectItem>
            <SelectItem value="workspace">Workspace members</SelectItem>
            <SelectItem value="private">Only me</SelectItem>
          </SelectContent>
        </Select>
        {access === 'link' && link && (
          <>
            <div className="flex gap-2">
              <Input readOnly value={link} className="text-xs" />
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(link).then(() => toast.success('Link copied'));
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={async () => {
                await regenerateShareToken(call.id);
                router.refresh();
                toast.success('Link regenerated');
              }}
            >
              Regenerate link
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function OverflowMenu({ call }: { call: Call }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="secondary">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={async () => {
            await setVisibility(call.id, call.visibility === 'workspace' ? 'private' : 'workspace');
            router.refresh();
            toast.success('Visibility updated');
          }}
        >
          <Check /> {call.visibility === 'workspace' ? 'Make private' : 'Share with workspace'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={async () => {
            await deleteCall(call.id);
            toast.success('Call deleted');
            router.push('/calls');
          }}
        >
          <Trash2 /> Delete call
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
