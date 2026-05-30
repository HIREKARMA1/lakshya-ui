"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export type TagListOnChange = (next: string[] | ((prev: string[]) => string[])) => void;

function applyTagChange(onChange: TagListOnChange, next: string[] | ((prev: string[]) => string[])) {
  onChange(next);
}

function normalizeTag(s: string) {
  return s.trim().toLowerCase();
}

export function MultiTagPicker({
  presetKeys,
  value,
  onChange,
  getPresetLabel,
  searchPlaceholder,
  addLabel,
  noResultsLabel,
  showAddAll = false,
  addAllLabel,
  chipClassName = "bg-primary/10 text-primary",
}: {
  presetKeys: readonly string[];
  value: string[];
  onChange: TagListOnChange;
  getPresetLabel: (key: string) => string;
  searchPlaceholder: string;
  addLabel: string;
  noResultsLabel: string;
  showAddAll?: boolean;
  addAllLabel?: string;
  chipClassName?: string;
}) {
  const { i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const presetOptions = useMemo(
    () =>
      presetKeys.map((key) => ({
        key,
        label: getPresetLabel(key),
      })),
    [presetKeys, getPresetLabel, i18n.language]
  );

  const selectedNormalized = useMemo(() => new Set(value.map(normalizeTag)), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return presetOptions.filter((opt) => {
      if (selectedNormalized.has(normalizeTag(opt.label))) return false;
      if (!q) return true;
      return opt.label.toLowerCase().includes(q);
    });
  }, [presetOptions, query, selectedNormalized]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const addLabelValue = (label: string) => {
    const v = label.trim();
    if (!v) return;
    const norm = normalizeTag(v);
    applyTagChange(onChange, (current) => {
      if (current.some((x) => normalizeTag(x) === norm)) return current;
      return [...current, v];
    });
    setQuery("");
    setOpen(false);
  };

  const addCustom = () => addLabelValue(query);

  const addAll = () => {
    applyTagChange(onChange, (current) => {
      const next = [...current];
      const seen = new Set(next.map(normalizeTag));
      for (const opt of presetOptions) {
        const norm = normalizeTag(opt.label);
        if (seen.has(norm)) continue;
        seen.add(norm);
        next.push(opt.label);
      }
      return next;
    });
    setQuery("");
    setOpen(false);
  };

  const removeAt = (index: number) => {
    applyTagChange(onChange, (current) => current.filter((_, i) => i !== index));
  };

  return (
    <div ref={rootRef} className="space-y-3">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <span
              key={`${index}-${tag}`}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${chipClassName}`}
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeAt(index);
                }}
                className="rounded p-0.5 hover:opacity-70"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered.length === 1) addLabelValue(filtered[0].label);
                else addCustom();
              }
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-md border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {open ? (
            <div
              className="dropdown-scroll absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-lg border border-line bg-white shadow-lg"
              onMouseDown={(e) => e.preventDefault()}
            >
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">{noResultsLabel}</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addLabelValue(opt.label);
                    }}
                    className="block w-full border-b border-line/50 px-3 py-2.5 text-left text-sm text-ink hover:bg-soft last:border-b-0"
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={addCustom}
          className="shrink-0 rounded-md bg-[#1b52a4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15418a]"
        >
          {addLabel}
        </button>
      </div>

      {showAddAll && addAllLabel ? (
        <button type="button" onClick={addAll} className="text-sm font-semibold text-primary hover:underline">
          {addAllLabel}
        </button>
      ) : null}
    </div>
  );
}
