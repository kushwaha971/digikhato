"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  useListNotesQuery,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  type Note,
} from "@/features/notes/notes-api";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function PinIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-4 h-4 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3H9v9l-2 2v2h5v6h2v-6h5v-2l-2-2V3z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}

interface NoteCardProps {
  note: Note;
  onOpen: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

function NoteCard({ note, onOpen, onTogglePin, onDelete }: NoteCardProps) {
  return (
    <div className="app-panel p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 min-w-0 text-left"
        >
          <p className="font-semibold text-text text-sm truncate">
            {note.title || <span className="italic text-muted">Untitled Note</span>}
          </p>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onTogglePin}
            className="p-1 rounded-lg hover:bg-surface2 transition-colors"
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <PinIcon filled={note.pinned} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 text-muted hover:text-danger-500 transition-colors"
            title="Delete note"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <button type="button" onClick={onOpen} className="text-left">
        {note.body ? (
          <p className="text-xs text-muted line-clamp-2">{note.body}</p>
        ) : (
          <p className="text-xs text-muted italic">No content</p>
        )}
        <p className="text-xs text-muted mt-2">{formatDate(note.updated_at)}</p>
      </button>
    </div>
  );
}

export default function NotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);

  const { data: notes, isFetching } = useListNotesQuery({ search: search || undefined });
  const [updateNote] = useUpdateNoteMutation();
  const [deleteNoteMutation, { isLoading: deleting }] = useDeleteNoteMutation();

  const pinnedNotes = notes?.filter((n) => n.pinned) ?? [];
  const unpinnedNotes = notes?.filter((n) => !n.pinned) ?? [];

  async function handleTogglePin(note: Note) {
    await updateNote({ id: note.id, pinned: !note.pinned });
  }

  async function handleDelete() {
    if (!deleteNote) return;
    await deleteNoteMutation(deleteNote.id);
    setDeleteNote(null);
  }

  return (
    <Screen
      title="Notes"
      actions={
        <Button size="sm" fullWidth={false} onClick={() => router.push("/notes/new")}>
          + New Note
        </Button>
      }
    >
      {/* Search bar */}
      <div className="mb-4">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(draftSearch); }}
          className="flex gap-2"
        >
          <Input
            placeholder="Search notes..."
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
          />
          <Button type="submit" variant="outline" size="sm" fullWidth={false}>
            Search
          </Button>
        </form>
      </div>

      {isFetching ? (
        <SkeletonList count={5} />
      ) : !notes || notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Capture ideas, reminders, or anything you want to remember."
          action={{ label: "New Note", onClick: () => router.push("/notes/new") }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Pinned section */}
          {pinnedNotes.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Pinned
              </h2>
              <div className="flex flex-col gap-2">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onOpen={() => router.push(`/notes/${note.id}`)}
                    onTogglePin={() => handleTogglePin(note)}
                    onDelete={() => setDeleteNote(note)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All / Other notes */}
          {unpinnedNotes.length > 0 && (
            <section>
              {pinnedNotes.length > 0 && (
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Other Notes
                </h2>
              )}
              <div className="flex flex-col gap-2">
                {unpinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onOpen={() => router.push(`/notes/${note.id}`)}
                    onTogglePin={() => handleTogglePin(note)}
                    onDelete={() => setDeleteNote(note)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteNote !== null}
        onClose={() => setDeleteNote(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        description={`Delete "${deleteNote?.title || "this note"}" permanently? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </Screen>
  );
}
