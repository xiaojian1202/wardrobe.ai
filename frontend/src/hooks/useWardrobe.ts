import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { ClothingItem, WardrobeStats, ItemVerificationPayload, BatchScanFileResult } from '../types';

export const WARDROBE_QUERY_KEYS = {
  all: ['wardrobe'] as const,
  stats: ['wardrobe-stats'] as const,
};

/**
 * Hook to fetch verified wardrobe items with caching
 */
export function useWardrobeQuery() {
  return useQuery<ClothingItem[], Error>({
    queryKey: WARDROBE_QUERY_KEYS.all,
    queryFn: () => api.getWardrobe(),
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    gcTime: 1000 * 60 * 30, // 30 minutes cache retention
  });
}

/**
 * Hook to fetch aggregated wardrobe stats
 */
export function useWardrobeStatsQuery() {
  return useQuery<WardrobeStats, Error>({
    queryKey: WARDROBE_QUERY_KEYS.stats,
    queryFn: () => api.getWardrobeStats(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for verifying or editing an item with optimistic updates
 */
export function useVerifyItemMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ClothingItem,
    Error,
    { itemId: number; data: Partial<ItemVerificationPayload> | Partial<ClothingItem> },
    { previousWardrobe?: ClothingItem[]; previousStats?: WardrobeStats }
  >({
    mutationFn: ({ itemId, data }) => api.verifyItem(itemId, data),

    onMutate: async ({ itemId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: WARDROBE_QUERY_KEYS.all });
      await queryClient.cancelQueries({ queryKey: WARDROBE_QUERY_KEYS.stats });

      const previousWardrobe = queryClient.getQueryData<ClothingItem[]>(WARDROBE_QUERY_KEYS.all);
      const previousStats = queryClient.getQueryData<WardrobeStats>(WARDROBE_QUERY_KEYS.stats);

      // Optimistically update wardrobe list if present
      if (previousWardrobe) {
        queryClient.setQueryData<ClothingItem[]>(
          WARDROBE_QUERY_KEYS.all,
          previousWardrobe.map((item) =>
            item.id === itemId
              ? ({ ...item, ...data, is_verified: true } as ClothingItem)
              : item
          )
        );
      }

      return { previousWardrobe, previousStats };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousWardrobe) {
        queryClient.setQueryData(WARDROBE_QUERY_KEYS.all, context.previousWardrobe);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(WARDROBE_QUERY_KEYS.stats, context.previousStats);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WARDROBE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: WARDROBE_QUERY_KEYS.stats });
    },
  });
}

/**
 * Hook for deleting an item with optimistic removal
 */
export function useDeleteItemMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    boolean,
    Error,
    number,
    { previousWardrobe?: ClothingItem[]; previousStats?: WardrobeStats }
  >({
    mutationFn: (itemId: number) => api.deleteItem(itemId),

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: WARDROBE_QUERY_KEYS.all });
      await queryClient.cancelQueries({ queryKey: WARDROBE_QUERY_KEYS.stats });

      const previousWardrobe = queryClient.getQueryData<ClothingItem[]>(WARDROBE_QUERY_KEYS.all);
      const previousStats = queryClient.getQueryData<WardrobeStats>(WARDROBE_QUERY_KEYS.stats);

      if (previousWardrobe) {
        queryClient.setQueryData<ClothingItem[]>(
          WARDROBE_QUERY_KEYS.all,
          previousWardrobe.filter((item) => item.id !== itemId)
        );
      }

      return { previousWardrobe, previousStats };
    },

    onError: (_err, _itemId, context) => {
      if (context?.previousWardrobe) {
        queryClient.setQueryData(WARDROBE_QUERY_KEYS.all, context.previousWardrobe);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(WARDROBE_QUERY_KEYS.stats, context.previousStats);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WARDROBE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: WARDROBE_QUERY_KEYS.stats });
    },
  });
}

/**
 * Hook for batch scanning images
 */
export function useBatchScanMutation() {
  return useMutation<BatchScanFileResult[], Error, File[]>({
    mutationFn: (files: File[]) => api.batchScanImages(files),
  });
}
