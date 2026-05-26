"use client";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGS } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import { Check, X, Languages, ChevronDown, ChevronUp } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(i18n.language?.slice(0, 2) ?? "en");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = i18n.language?.slice(0, 2) ?? "en";
    setCurrent(c);
    if (typeof document !== "undefined") {
      document.documentElement.lang = c;
    }
  }, [i18n.language]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const change = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  const active = SUPPORTED_LANGS.find((l) => l.code === current) ?? SUPPORTED_LANGS[0];

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink hover:border-primary/40 hover:bg-soft"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Languages className="h-4 w-4 text-ink/70" />
        {active.label}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Select language"
          className="absolute right-0 top-[calc(100%+10px)] z-[80] w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-line"
        >

          <div className="flex items-start justify-between px-5 pb-3 pt-4">
            <div>
              <h3 className="text-base font-extrabold text-ink">Select Language</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Choose your preferred language</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e94e3a] text-white hover:bg-[#d63b27]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul role="listbox" className="max-h-[60vh] overflow-y-auto pb-2">
            {SUPPORTED_LANGS.map((l) => {
              const isActive = current === l.code;
              return (
                <li key={l.code}>
                  <button
                    onClick={() => change(l.code)}
                    className={`flex w-full items-center justify-between px-5 py-2.5 text-left transition ${
                      isActive ? "bg-[#eaf2ff]" : "hover:bg-soft"
                    }`}
                  >
                    <span>
                      <span className={`block text-sm font-semibold ${isActive ? "text-primary" : "text-ink"}`}>
                        {l.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">{l.native}</span>
                    </span>
                    {isActive && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
