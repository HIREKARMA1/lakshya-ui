import { LegalDocumentPage } from "@/components/pages/legal-document-page";

export const metadata = {
  title: "Privacy Policy — LAKSHYA",
  description: "Privacy policy for the LAKSHYA employment platform by Hirekarma Private Limited.",
};

export default function PrivacyRoute() {
  return <LegalDocumentPage i18nKey="pages.privacy" />;
}
