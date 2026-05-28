/** Stored form values for highest education (API `education_key`). */
export const EDUCATION_KEYS = [
  "below10th",
  "10th",
  "12th",
  "iti",
  "diploma",
  "graduate",
  "postGraduate",
] as const;

export type EducationKey = (typeof EDUCATION_KEYS)[number];

export const EDUCATION_LABELS_FALLBACK: Record<string, string> = {
  selectPlaceholder: "Select education level",
  below10th: "Below 10th",
  "10th": "10th Pass",
  "12th": "12th Pass",
  iti: "ITI",
  diploma: "Diploma",
  graduate: "Graduate",
  postGraduate: "Post Graduate",
};

export function parseEducationLabels(block: unknown): Record<string, string> {
  if (typeof block === "string") {
    return EDUCATION_LABELS_FALLBACK;
  }
  if (typeof block !== "object" || block === null || Array.isArray(block)) {
    return EDUCATION_LABELS_FALLBACK;
  }
  return { ...EDUCATION_LABELS_FALLBACK, ...(block as Record<string, string>) };
}
