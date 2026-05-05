"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  useGetNoteQuery,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from "@/features/notes/notes-api";

function PinIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3H9v9l-2 2v2h5v6h2v-6h5v-2l-2-2V3z" />
    </svg>
  );
}

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const noteId = Number(params.id);
  const router = useRouter();

  const { data: note, isFetching } = useGetNoteQuery(noteId);
  const [updateNote, { isLoading: saving }] = useUpdateNoteMutation();
  const [deleteNote, { isLoading: deleting }] = useDeleteNoteMutation();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync local state once note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setDirty(false);
    }
  }, [note]);

  function handleTitleChange(val: string) {
    setTitle(val);
    setDirty(true);
  }

  function handleBodyChange(val: string) {
    setBody(val);
    setDirty(true);
  }

  async function handleSave() {
    await updateNote({ id: noteId, title: title.trim(), body: body.trim() });
    setDirty(false);
  }

  async function handleTogglePin() {
    if (!note) return;
    await updateNote({ id: noteId, pinned: !note.pinned });
  }

  async function handleDelete() {
    await deleteNote(noteId);
    router.push("/notes");
  }

  const pageTitle = note?.title?.trim() || "Untitled Note";
  const isPinned = note?.pinned ?? false;

  if (isFetching) {
    return (
      <Screen title="Note" backHref="/notes">
        <SkeletonList count={3} />
      </Screen>
    );
  }

  if (!note) {
    return (
      <Screen title="Note" backHref="/notes">
        <EmptyState title="Note not found" description="This note may have been deleted." />
      </Screen>
    );
  }

  return (
    <Screen
      title={pageTitle}
      backHref="/notes"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePin}
            className={`p-2 rounded-xl border transition-colors ${
              isPinned
                ? "border-primary-300 bg-primary-50 text-primary-500 dark:border-primary-700 dark:bg-primary-900/20"
                : "border-border bg-surface text-muted hover:text-text hover:border-neutral-300 dark:hover:border-neutral-600"
            }`}
            title={isPinned ? "Unpin note" : "Pin note"}
          >
            <PinIcon filled={isPinned} />
          </button>
          <Button
            size="sm"
            fullWidth={false}
            onClick={handleSave}
            disabled={!dirty || saving}
            loading={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Title field */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title"
        />

        <Textarea
          label="Content"
          placeholder="Write something..."
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          rows={10}
          className="min-h-[200px]"
        />

        {/* Last updated */}
        <p className="text-xs text-muted">
          Last updated:{" "}
          {new Date(note.updated_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        {/* Delete */}
        <div className="mt-6 pt-6 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            fullWidth={false}
            onClick={() => setShowDelete(true)}
            className="text-danger-500 hover:text-danger-600"
          >
            Delete Note
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        description={`Delete "${note.title || "this note"}" permanently? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </Screen>
  );
}
