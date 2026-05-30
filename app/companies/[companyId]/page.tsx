import { CompanyPublicProfilePage } from "@/components/pages/company-public-profile-page";

export default function CompanyProfileRoute({ params }: { params: { companyId: string } }) {
  return <CompanyPublicProfilePage companyId={params.companyId} />;
}
