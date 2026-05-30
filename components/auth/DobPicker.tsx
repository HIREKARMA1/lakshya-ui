"use client";

import { useTranslation } from "react-i18next";
import { LakshyaDatePicker } from "@/components/ui/LakshyaDatePicker";

function defaultBirthViewMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear() - 25, now.getMonth(), 1);
}

export function DobPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const { t } = useTranslation();
  const toYear = new Date().getFullYear();

  return (
    <LakshyaDatePicker
      mode="date"
      value={value}
      onChange={onChange}
      fromYear={1950}
      toYear={toYear}
      disableAfter={new Date()}
      defaultViewMonth={defaultBirthViewMonth}
      placeholder={t("register.seeker.dob.placeholder", { defaultValue: "mm/dd/yyyy" })}
      ariaLabel={t("register.seeker.fields.dob")}
      headerTitle={t("register.seeker.dob.selectDate")}
    />
  );
}
