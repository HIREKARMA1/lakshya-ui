"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FROM_YEAR = 1950;

function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d);
}

function toISODate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplay(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function defaultBirthViewMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear() - 25, now.getMonth(), 1);
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isRadixSelectTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!(
    target.closest("[data-radix-select-viewport]") ||
    target.closest('[role="listbox"]') ||
    target.closest('[role="option"]')
  );
}

const dobSelectTriggerCls =
  "h-9 gap-1.5 border-line bg-soft/30 px-2.5 text-sm font-semibold text-ink shadow-none transition-colors hover:bg-soft/60 focus:border-primary focus:ring-2 focus:ring-primary/15 data-[placeholder]:text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:opacity-60";

const dobSelectContentCls =
  "z-[100] max-h-[220px] border-line bg-white p-1 shadow-lg [&_[data-radix-select-viewport]]:p-1";

const dobSelectItemCls =
  "cursor-pointer rounded-md py-2 pl-2.5 pr-8 text-sm font-medium text-ink outline-none focus:bg-primary/10 focus:text-ink data-[highlighted]:bg-primary/10 data-[state=checked]:bg-primary data-[state=checked]:text-white";

export function DobPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const { t } = useTranslation();
  const toYear = new Date().getFullYear();

  const selected = useMemo(() => parseISODate(value), [value]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Date | null>(selected);
  const [viewMonth, setViewMonth] = useState<Date>(() => selected ?? defaultBirthViewMonth());

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i),
        label: new Date(2000, i, 1).toLocaleString(undefined, { month: "short" }),
      })),
    [],
  );

  const yearOptions = useMemo(
    () => Array.from({ length: toYear - FROM_YEAR + 1 }, (_, i) => String(toYear - i)),
    [toYear],
  );

  useEffect(() => {
    if (!open) return;
    const base = selected ?? defaultBirthViewMonth();
    setPending(selected);
    setViewMonth(monthStart(base));
  }, [open, selected]);

  const placeholder = t("register.seeker.dob.placeholder", { defaultValue: "mm/dd/yyyy" });

  const applyMonthYear = (monthIndex: number, year: number) => {
    const clampedYear = Math.min(Math.max(year, FROM_YEAR), toYear);
    const nextView = new Date(clampedYear, monthIndex, 1);
    setViewMonth(nextView);
    if (pending) {
      const maxDay = new Date(clampedYear, monthIndex + 1, 0).getDate();
      const day = Math.min(pending.getDate(), maxDay);
      setPending(new Date(clampedYear, monthIndex, day));
    }
  };

  const confirm = () => {
    setOpen(false);
    onChange(pending ? toISODate(pending) : "");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full rounded-md border border-line bg-white px-3 py-2.5 text-left text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15",
          )}
          aria-label={t("register.seeker.fields.dob")}
        >
          <div className="flex items-center justify-between gap-3">
            <span className={selected ? "" : "text-muted-foreground"}>
              {selected ? formatDisplay(selected) : placeholder}
            </span>
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[300px] p-0"
        onInteractOutside={(e) => {
          if (isRadixSelectTarget(e.target)) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (isRadixSelectTarget(e.target)) e.preventDefault();
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
          <div className="text-xs font-bold tracking-[0.12em] text-ink">
            {t("register.seeker.dob.selectDate")}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setOpen(false)}
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b border-line bg-soft/20 px-3 py-2.5">
          <div className="flex gap-2">
            <Select
              value={String(viewMonth.getMonth())}
              onValueChange={(v) => applyMonthYear(Number(v), viewMonth.getFullYear())}
            >
              <SelectTrigger className={cn(dobSelectTriggerCls, "min-w-0 flex-1")} aria-label={t("register.seeker.dob.month")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={dobSelectContentCls} position="popper" sideOffset={4}>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value} className={dobSelectItemCls}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(viewMonth.getFullYear())}
              onValueChange={(v) => applyMonthYear(viewMonth.getMonth(), Number(v))}
            >
              <SelectTrigger className={cn(dobSelectTriggerCls, "w-[5.5rem] shrink-0")} aria-label={t("register.seeker.dob.year")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={dobSelectContentCls} position="popper" sideOffset={4}>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y} className={dobSelectItemCls}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-2 pb-2 pt-1">
          <UiCalendar
            mode="single"
            month={viewMonth}
            onMonthChange={setViewMonth}
            selected={pending ?? undefined}
            onSelect={(d) => setPending(d ?? null)}
            showOutsideDays={false}
            disabled={{ after: new Date() }}
            className="w-full bg-white p-0"
            classNames={{
              root: "w-full",
              months: "w-full",
              month: "w-full gap-2",
              month_caption: "hidden",
              nav: "hidden",
              weekdays: "grid grid-cols-7",
              weekday: "py-1 text-center text-[11px] font-semibold uppercase text-muted-foreground",
              week: "mt-0 grid grid-cols-7",
              day: "p-0 text-center",
              day_button:
                "mx-auto h-8 w-8 rounded-md text-sm font-medium text-ink hover:bg-soft data-[selected=true]:bg-primary data-[selected=true]:text-white",
              today: "rounded-md border border-primary/30 bg-primary/10 text-primary",
              outside: "text-muted-foreground/40",
              disabled: "text-muted-foreground/30",
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2.5">
          <button
            type="button"
            className="text-xs font-semibold text-muted-foreground hover:text-ink"
            onClick={() => {
              setPending(null);
              onChange("");
            }}
          >
            {t("common.clear")}
          </button>

          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={() => {
              const today = new Date();
              setPending(today);
              setViewMonth(monthStart(today));
            }}
          >
            {t("common.today")}
          </button>

          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40"
            onClick={confirm}
            disabled={pending === null}
          >
            {t("common.confirm")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
