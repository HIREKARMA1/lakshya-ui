import { LegalDocumentPage } from "@/components/pages/legal-document-page";

export const metadata = {
  title: "Terms of Service — LAKSHYA",
  description: "Terms of service for using the LAKSHYA employment platform by Hirekarma Private Limited.",
};

export default function TermsRoute() {
  return <LegalDocumentPage i18nKey="pages.terms" />;
}
