"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const WORK_ROLE_KEYS = [
  "any",
  "delivery",
  "driver",
  "electrician",
  "cook",
  "security",
  "cleaner",
  "dataEntry",
  "welder",
] as const;

export type WorkRoleKey = (typeof WORK_ROLE_KEYS)[number];

const MAX_ROLES = 5;

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
};

export function WorkRolesMultiSelect({ value, onChange, className }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORK_ROLE_KEYS;
    return WORK_ROLE_KEYS.filter((key) => t(`roles.${key}`).toLowerCase().includes(q));
  }, [query, t]);

  const toggle = (key: WorkRoleKey) => {
    if (key === "any") {
      onChange(value.includes("any") ? [] : ["any"]);
      return;
    }
    const withoutAny = value.filter((v) => v !== "any");
    if (withoutAny.includes(key)) {
      onChange(withoutAny.filter((v) => v !== key));
      return;
    }
    if (withoutAny.length >= MAX_ROLES) return;
    onChange([...withoutAny, key]);
  };

  const remove = (key: string) => onChange(value.filter((v) => v !== key));

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            className={cn(
              "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-line bg-white px-3 py-2 text-left text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15",
            )}
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{t("register.seeker.workRoles.placeholder")}</span>
              ) : (
                value.map((key) => (
                  <span
                    key={key}
                    className="inline-flex max-w-[9rem] items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                  >
                    <span className="truncate">{t(`roles.${key}`)}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="rounded-full hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(key);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          remove(key);
                        }
                      }}
                      aria-label={t("common.close")}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </span>
                ))
              )}
            </div>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0" sideOffset={4}>
          <div className="border-b border-line p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("register.seeker.workRoles.search")}
                className="h-9 w-full rounded-md border border-line bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>
          <ul className="max-h-[220px] overflow-y-auto p-1">
            {filtered.map((key) => {
              const checked = value.includes(key);
              const atLimit = value.length >= MAX_ROLES && !checked && key !== "any" && !value.includes("any");
              return (
                <li key={key}>
                  <button
                    type="button"
                    disabled={atLimit}
                    onClick={() => toggle(key)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition",
                      checked ? "bg-primary/10 text-ink" : "hover:bg-soft",
                      atLimit && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <span className="font-medium">{t(`roles.${key}`)}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">{t("register.seeker.workRoles.empty")}</li>
            )}
          </ul>
        </PopoverContent>
      </Popover>
      <p className="mt-1.5 text-xs text-muted-foreground">{t("register.seeker.workRoles.hint")}</p>
    </div>
  );
}
