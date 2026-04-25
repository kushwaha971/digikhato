import { api } from "@/store/api";

export interface Note {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export const notesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listNotes: builder.query<Note[], { pinned?: boolean; search?: string }>({
      query: (params) => ({ url: "notes/", params }),
      providesTags: ["Note"],
      transformResponse: (res: { results: Note[] }) => res.results,
    }),
    getNote: builder.query<Note, number>({
      query: (id) => ({ url: `notes/${id}/` }),
      providesTags: ["Note"],
    }),
    createNote: builder.mutation<Note, { title?: string; body?: string; pinned?: boolean }>({
      query: (data) => ({ url: "notes/", method: "POST", data, successMessage: "Note saved." }),
      invalidatesTags: ["Note"],
    }),
    updateNote: builder.mutation<Note, { id: number; title?: string; body?: string; pinned?: boolean }>({
      query: ({ id, ...data }) => ({ url: `notes/${id}/`, method: "PATCH", data, successMessage: "Note updated." }),
      invalidatesTags: ["Note"],
    }),
    deleteNote: builder.mutation<void, number>({
      query: (id) => ({ url: `notes/${id}/`, method: "DELETE", successMessage: "Note deleted." }),
      invalidatesTags: ["Note"],
    }),
  }),
});

export const {
  useListNotesQuery,
  useGetNoteQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = notesApi;
