"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Search, X } from "lucide-react";

type Option = { value: string; label: string };

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No results",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  const clear = (e: ReactMouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`lk-input flex w-full items-center justify-between gap-2 text-left ${
          open ? "border-primary ring-2 ring-primary/15" : ""
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-ink" : "text-muted-foreground"}`}>
          {selected?.label ?? placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {value ? (
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") clear(e as unknown as ReactMouseEvent);
              }}
              className="rounded p-0.5 text-muted-foreground hover:bg-soft hover:text-ink"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <span className="text-[11px] font-light text-slate-400">{open ? "▴" : "▾"}</span>
        </span>
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-line bg-white shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="border-b border-line p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-primary/40 py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>
          <div className="dropdown-scroll max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    pick(opt.value);
                  }}
                  className={`block w-full px-3 py-2.5 text-left text-sm transition hover:bg-soft ${
                    value === opt.value ? "bg-primary/10 font-semibold text-primary" : "text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
