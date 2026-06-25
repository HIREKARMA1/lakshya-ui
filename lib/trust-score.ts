/** Trust score from API: stored as 0–100 in DB; schema may document 0–1. */
export function trustScorePercent(score: number | null | undefined): number {
  const value = score ?? 0;
  if (value <= 1) return Math.round(value * 100);
  return Math.round(Math.min(100, value));
}

export function isHighTrustScore(score: number | null | undefined): boolean {
  return trustScorePercent(score) >= 75;
}
