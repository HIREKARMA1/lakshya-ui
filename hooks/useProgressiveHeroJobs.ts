import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Job } from "@/types/job";
import { sortJobsByNewest } from "@/lib/sort-jobs";

const INITIAL_LIMIT = 3;
const MAX_HERO_JOBS = 8;

function mergeUniqueJobs(existing: Job[], incoming: Job[]) {
  const seen = new Set(existing.map((job) => job.id));
  const merged = [...existing];
  for (const job of incoming) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    merged.push(job);
  }
  return merged;
}

export function useProgressiveHeroJobs() {
  const [extraJobs, setExtraJobs] = useState<Job[]>([]);

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ["public-jobs", "hero-initial", INITIAL_LIMIT],
    queryFn: () => api.searchPublicJobs({ limit: INITIAL_LIMIT, page: 1 }),
    retry: false,
    staleTime: 60_000,
  });

  const initialJobs = data?.jobs ?? [];
  const loadMoreStarted = useRef(false);

  useEffect(() => {
    if (!isSuccess || !data?.jobs?.length || loadMoreStarted.current) return;
    loadMoreStarted.current = true;

    const initial = data.jobs;
    const targetCount = Math.min(MAX_HERO_JOBS, data.total ?? initial.length);
    if (initial.length >= targetCount) return;

    let cancelled = false;

    (async () => {
      for (let index = initial.length; index < targetCount; index += 1) {
        if (cancelled) break;

        const page = index + 1;
        const res = await api.searchPublicJobs({ limit: 1, page });
        if (cancelled || res.jobs.length === 0) break;

        const job = res.jobs[0];
        setExtraJobs((prev) => mergeUniqueJobs(prev, [job]));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSuccess, data]);

  const jobs = useMemo(
    () => sortJobsByNewest(mergeUniqueJobs(initialJobs, extraJobs)).slice(0, MAX_HERO_JOBS),
    [initialJobs, extraJobs],
  );

  return {
    jobs,
    isInitialLoading: isLoading,
  };
}
