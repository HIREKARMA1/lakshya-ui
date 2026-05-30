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

function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d);
}

function parseDateTimeLocal(value: string | null | undefined): {
  date: Date | null;
  hour24: number;
  minute: number;
} {
  const date = parseISODate(value);
  if (!value) return { date: null, hour24: 9, minute: 0 };
  const tm = /T(\d{2}):(\d{2})/.exec(value);
  if (!tm) return { date, hour24: 9, minute: 0 };
  return { date, hour24: Number(tm[1]), minute: Number(tm[2]) };
}

function toISODate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toDateTimeLocal(date: Date, hour24: number, minute: number): string {
  const hh = String(hour24).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${toISODate(date)}T${hh}:${mm}`;
}

function formatDisplayDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function formatDisplayDateTime(date: Date, hour24: number, minute: number): string {
  const h12 = hour24 % 12 || 12;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const mm = String(minute).padStart(2, "0");
  return `${formatDisplayDate(date)}, ${h12}:${mm} ${ampm}`;
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isRadixSelectTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!(
    target.closest("[data-radix-select-viewport]") ||
    target.closest('[role="listbox"]') ||
    target.closest('[role="option"]')
  );
}

const pickerSelectTriggerCls =
  "h-9 gap-1.5 border-line bg-soft/30 px-2.5 text-sm font-semibold text-ink shadow-none transition-colors hover:bg-soft/60 focus:border-primary focus:ring-2 focus:ring-primary/15 data-[placeholder]:text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:opacity-60";

const pickerSelectContentCls =
  "z-[100] max-h-[220px] border-line bg-white p-1 shadow-lg [&_[data-radix-select-viewport]]:p-1";

const pickerSelectItemCls =
  "cursor-pointer rounded-md py-2 pl-2.5 pr-8 text-sm font-medium text-ink outline-none focus:bg-primary/10 focus:text-ink data-[highlighted]:bg-primary/10 data-[state=checked]:bg-primary data-[state=checked]:text-white";

const calendarClassNames = {
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
};

export type LakshyaDatePickerProps = {
  value: string;
  onChange: (next: string) => void;
  mode?: "date" | "datetime";
  placeholder?: string;
  ariaLabel?: string;
  headerTitle?: string;
  fromYear?: number;
  toYear?: number;
  defaultViewMonth?: () => Date;
  disableBefore?: Date;
  disableAfter?: Date;
  className?: string;
};

export function LakshyaDatePicker({
  value,
  onChange,
  mode = "date",
  placeholder,
  ariaLabel,
  headerTitle,
  fromYear = new Date().getFullYear() - 80,
  toYear = new Date().getFullYear() + 10,
  defaultViewMonth,
  disableBefore,
  disableAfter,
  className,
}: LakshyaDatePickerProps) {
  const { t } = useTranslation();
  const isDateTime = mode === "datetime";

  const parsed = useMemo(() => parseDateTimeLocal(value), [value]);
  const selectedDate = parsed.date;

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Date | null>(selectedDate);
  const [hour12, setHour12] = useState(() => {
    const h = parsed.hour24 % 12 || 12;
    return String(h);
  });
  const [minute, setMinute] = useState(() => String(parsed.minute).padStart(2, "0"));
  const [ampm, setAmpm] = useState<"AM" | "PM">(parsed.hour24 >= 12 ? "PM" : "AM");
  const [viewMonth, setViewMonth] = useState<Date>(
    () => selectedDate ?? defaultViewMonth?.() ?? monthStart(new Date())
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i),
        label: new Date(2000, i, 1).toLocaleString(undefined, { month: "short" }),
      })),
    []
  );

  const yearOptions = useMemo(
    () => Array.from({ length: toYear - fromYear + 1 }, (_, i) => String(toYear - i)),
    [fromYear, toYear]
  );

  const hourOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1)), []);
  const minuteOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")), []);

  useEffect(() => {
    if (!open) return;
    const base = selectedDate ?? defaultViewMonth?.() ?? new Date();
    setPending(selectedDate);
    setHour12(String(parsed.hour24 % 12 || 12));
    setMinute(String(parsed.minute).padStart(2, "0"));
    setAmpm(parsed.hour24 >= 12 ? "PM" : "AM");
    setViewMonth(monthStart(base));
  }, [open, selectedDate, parsed.hour24, parsed.minute, defaultViewMonth]);

  const disabledMatcher = useMemo(() => {
    const list: ({ before: Date } | { after: Date })[] = [];
    if (disableBefore) list.push({ before: startOfDay(disableBefore) });
    if (disableAfter) list.push({ after: startOfDay(disableAfter) });
    return list.length ? list : undefined;
  }, [disableBefore, disableAfter]);

  const applyMonthYear = (monthIndex: number, year: number) => {
    const clampedYear = Math.min(Math.max(year, fromYear), toYear);
    const nextView = new Date(clampedYear, monthIndex, 1);
    setViewMonth(nextView);
    if (pending) {
      const maxDay = new Date(clampedYear, monthIndex + 1, 0).getDate();
      const day = Math.min(pending.getDate(), maxDay);
      setPending(new Date(clampedYear, monthIndex, day));
    }
  };

  const toHour24 = () => {
    let h = Number(hour12) % 12;
    if (ampm === "PM") h += 12;
    return h;
  };

  const displayValue = useMemo(() => {
    if (!selectedDate) return null;
    if (isDateTime) return formatDisplayDateTime(selectedDate, parsed.hour24, parsed.minute);
    return formatDisplayDate(selectedDate);
  }, [selectedDate, isDateTime, parsed.hour24, parsed.minute]);

  const confirm = () => {
    if (!pending) return;
    if (isDateTime) {
      onChange(toDateTimeLocal(pending, toHour24(), Number(minute)));
    } else {
      onChange(toISODate(pending));
    }
    setOpen(false);
  };

  const ph =
    placeholder ??
    (isDateTime
      ? t("providerDashboard.postJob.fields.schedulePh", { defaultValue: "mm/dd/yyyy, hh:mm AM" })
      : t("register.seeker.dob.placeholder", { defaultValue: "mm/dd/yyyy" }));

  const title =
    headerTitle ??
    (isDateTime
      ? t("providerDashboard.postJob.fields.selectSchedule", { defaultValue: "Select date & time" })
      : t("register.seeker.dob.selectDate", { defaultValue: "Select date" }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full rounded-md border border-line bg-white px-3 py-2.5 text-left text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15",
            className
          )}
          aria-label={ariaLabel ?? ph}
        >
          <div className="flex items-center justify-between gap-3">
            <span className={displayValue ? "" : "text-muted-foreground"}>{displayValue ?? ph}</span>
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn("p-0", isDateTime ? "w-[min(100vw-2rem,380px)]" : "w-[300px]")}
        onInteractOutside={(e) => {
          if (isRadixSelectTarget(e.target)) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (isRadixSelectTarget(e.target)) e.preventDefault();
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
          <div className="text-xs font-bold tracking-[0.12em] text-ink">{title}</div>
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
              <SelectTrigger className={cn(pickerSelectTriggerCls, "min-w-0 flex-1")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={pickerSelectContentCls} position="popper" sideOffset={4}>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value} className={pickerSelectItemCls}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(viewMonth.getFullYear())}
              onValueChange={(v) => applyMonthYear(viewMonth.getMonth(), Number(v))}
            >
              <SelectTrigger className={cn(pickerSelectTriggerCls, "w-[5.5rem] shrink-0")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={pickerSelectContentCls} position="popper" sideOffset={4}>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y} className={pickerSelectItemCls}>
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
            disabled={disabledMatcher}
            className="w-full bg-white p-0"
            classNames={calendarClassNames}
          />
        </div>

        {isDateTime ? (
          <div className="border-t border-line bg-soft/20 px-3 py-2.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("providerDashboard.postJob.fields.time", { defaultValue: "Time" })}
            </p>
            <div className="flex gap-2">
              <Select value={hour12} onValueChange={setHour12}>
                <SelectTrigger className={cn(pickerSelectTriggerCls, "w-[4.5rem] shrink-0")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={pickerSelectContentCls} position="popper" sideOffset={4}>
                  {hourOptions.map((h) => (
                    <SelectItem key={h} value={h} className={pickerSelectItemCls}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className={cn(pickerSelectTriggerCls, "w-[4.5rem] shrink-0")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(pickerSelectContentCls, "max-h-[180px]")} position="popper" sideOffset={4}>
                  {minuteOptions.map((m) => (
                    <SelectItem key={m} value={m} className={pickerSelectItemCls}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ampm} onValueChange={(v) => setAmpm(v as "AM" | "PM")}>
                <SelectTrigger className={cn(pickerSelectTriggerCls, "w-[5rem] shrink-0")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={pickerSelectContentCls} position="popper" sideOffset={4}>
                  <SelectItem value="AM" className={pickerSelectItemCls}>
                    AM
                  </SelectItem>
                  <SelectItem value="PM" className={pickerSelectItemCls}>
                    PM
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

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
              if (isDateTime) {
                const nowH = today.getHours();
                setHour12(String(nowH % 12 || 12));
                setMinute(String(today.getMinutes()).padStart(2, "0"));
                setAmpm(nowH >= 12 ? "PM" : "AM");
              }
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
