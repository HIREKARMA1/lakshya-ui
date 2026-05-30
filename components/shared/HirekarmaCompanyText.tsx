"use client";

import Link from "next/link";
import { Trans } from "react-i18next";

export const HIREKARMA_URL = "https://hirekarma.in/";

const companyLink = (
  <Link
    href={HIREKARMA_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium text-primary hover:underline"
  />
);

type Props = {
  i18nKey: string;
  as?: "p" | "span";
  className?: string;
};

export function HirekarmaCompanyText({ i18nKey, as = "p", className }: Props) {
  const Tag = as;
  return (
    <Tag className={className}>
      <Trans i18nKey={i18nKey} components={{ companyLink }} />
    </Tag>
  );
}
