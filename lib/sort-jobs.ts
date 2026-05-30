import type { Job } from "@/types/job";

/** Lower postedDays means more recently posted. */
export function compareJobsByNewest(a: Job, b: Job): number {
  return a.postedDays - b.postedDays;
}

export function sortJobsByNewest(jobs: Job[]): Job[] {
  return [...jobs].sort(compareJobsByNewest);
}
