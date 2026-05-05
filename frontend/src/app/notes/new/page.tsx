"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
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

        <Textarea
          label="Content"
          placeholder="Write something..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="min-h-[200px]"
        />
      </div>
    </Screen>
  );
}
