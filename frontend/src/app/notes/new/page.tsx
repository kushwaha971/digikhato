"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateNoteMutation } from "@/features/notes/notes-api";

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [createNote, { isLoading: saving }] = useCreateNoteMutation();

  const dirty = title.trim().length > 0 || body.trim().length > 0;

  async function handleSave() {
    const res = await createNote({ title: title.trim(), body: body.trim() });
    if ("data" in res && res.data) {
      router.replace(`/notes/${res.data.id}`);
    }
  }

  return (
    <Screen
      title="New Note"
      backHref="/notes"
      actions={(
        <Button
          size="sm"
          fullWidth={false}
          onClick={handleSave}
          disabled={!dirty || saving}
          loading={saving}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      )}
    >
      <div className="flex flex-col gap-5">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Content</label>
          <textarea
            className="w-full border border-border bg-surface rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-muted resize-none focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-150 min-h-[200px]"
            placeholder="Write something..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      </div>
    </Screen>
  );
}
