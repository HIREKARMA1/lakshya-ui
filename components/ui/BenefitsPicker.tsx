"use client";

import { BENEFIT_KEYS } from "@/data/benefitKeys";
import { MultiTagPicker, type TagListOnChange } from "@/components/ui/MultiTagPicker";

export function BenefitsPicker({
  value,
  onChange,
  getPresetLabel,
  searchPlaceholder,
  addLabel,
  noResultsLabel,
}: {
  value: string[];
  onChange: TagListOnChange;
  getPresetLabel: (key: string) => string;
  searchPlaceholder: string;
  addLabel: string;
  noResultsLabel: string;
}) {
  return (
    <MultiTagPicker
      presetKeys={BENEFIT_KEYS}
      value={value}
      onChange={onChange}
      getPresetLabel={getPresetLabel}
      searchPlaceholder={searchPlaceholder}
      addLabel={addLabel}
      noResultsLabel={noResultsLabel}
    />
  );
}
