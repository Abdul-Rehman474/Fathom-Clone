'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import type { HighlightTag } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/toaster';
import { addTag, updateTag, deleteTag, moveTag } from '@/app/(app)/settings/actions';

// Distinguishable tag colours drawn from the system's lime/neutral/status tones.
const SWATCHES = ['#C8FF3D', '#6FCF3F', '#E5C558', '#E08A3C', '#E5484D', '#F3F5EF', '#9BA298', '#9FC92F'];

export function HighlightTagsManager({ tags }: { tags: HighlightTag[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <section id="tags" className="scroll-mt-24">
      <h2 className="border-b border-border pb-4 font-display text-xl font-semibold tracking-tight">Highlight options</h2>
      <div>
        {tags.map((tag, i) => (
          <div key={tag.id} className="flex items-center gap-3 border-b border-border py-3">
            <div className="flex flex-col">
              <button
                disabled={i === 0}
                onClick={async () => {
                  await moveTag(tag.id, 'up');
                  router.refresh();
                }}
                className="text-text-3 disabled:opacity-30 hover:text-text-1"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                disabled={i === tags.length - 1}
                onClick={async () => {
                  await moveTag(tag.id, 'down');
                  router.refresh();
                }}
                className="text-text-3 disabled:opacity-30 hover:text-text-1"
              >
                <ArrowDown className="size-3.5" />
              </button>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button className="size-6 rounded-[5px]" style={{ backgroundColor: tag.color }} aria-label="Change colour" />
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <div className="grid grid-cols-4 gap-2">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      onClick={async () => {
                        await updateTag(tag.id, { color: c });
                        router.refresh();
                      }}
                      className="size-7 rounded-[5px] ring-offset-2 ring-offset-surface-2 hover:ring-2 hover:ring-white"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <input
              defaultValue={tag.name}
              onBlur={async (e) => {
                if (e.target.value !== tag.name && e.target.value.trim()) {
                  await updateTag(tag.id, { name: e.target.value.trim() });
                  router.refresh();
                }
              }}
              className="flex-1 bg-transparent text-sm font-semibold uppercase tracking-wide outline-none"
              style={{ color: tag.color }}
            />

            <button
              onClick={async () => {
                await deleteTag(tag.id);
                router.refresh();
                toast.success('Tag deleted');
              }}
              className="text-text-3 hover:text-danger"
              aria-label="Delete tag"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex gap-2">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tag name"
            className="h-9"
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && newName.trim()) {
                await addTag(newName.trim(), SWATCHES[0]);
                setNewName('');
                setAdding(false);
                router.refresh();
              }
            }}
          />
          <Button
            size="sm"
            onClick={async () => {
              if (!newName.trim()) return;
              await addTag(newName.trim(), SWATCHES[0]);
              setNewName('');
              setAdding(false);
              router.refresh();
            }}
          >
            Add
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <Plus /> Add more
        </Button>
      )}
    </section>
  );
}
