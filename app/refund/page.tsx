import { LegalDocumentPage } from "@/components/pages/legal-document-page";

export const metadata = {
  title: "Refund Policy — LAKSHYA",
  description: "Refund policy for paid services on the LAKSHYA employment platform by Hirekarma Private Limited.",
};

export default function RefundRoute() {
  return <LegalDocumentPage i18nKey="pages.refund" />;
}
