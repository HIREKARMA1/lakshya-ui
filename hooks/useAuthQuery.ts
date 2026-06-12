"use client";

import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export function useAuthQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn" | "enabled">,
): UseQueryResult<T> {
  const { user, isSessionReady } = useAuth();
  return useQuery({
    queryKey,
    queryFn,
    enabled: isSessionReady && !!user,
    ...options,
  });
}
