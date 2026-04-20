"use client";

import { useCreateCollectionMutation, useUpdateCollectionMutation } from "@/features/collections/collection-api";

export function useCollectionWorkflow() {
  const [createCollection, createState] = useCreateCollectionMutation();
  const [updateCollection, updateState] = useUpdateCollectionMutation();

  return {
    saveCollection: createCollection,
    correctCollection: updateCollection,
    isSaving: createState.isLoading || updateState.isLoading,
  };
}
