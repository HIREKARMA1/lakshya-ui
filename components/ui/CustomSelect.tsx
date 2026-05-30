"use client";

import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="lk-input flex w-full items-center justify-between text-left"
      >
        <span className={selected ? "text-ink" : "text-muted-foreground"}>
          {selected?.label ?? placeholder}
        </span>
        <span className="text-[11px] font-light text-slate-400">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div
          className="dropdown-scroll absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-white shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-soft ${
                value === opt.value ? "bg-primary/10 font-semibold text-primary" : "text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PillSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              active
                ? "border-primary bg-primary/5 text-primary"
                : "border-line bg-white text-ink hover:border-primary/40"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
