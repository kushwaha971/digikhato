import { ModulePlaceholder } from "@/components/jewellery/shared/ModulePlaceholder";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const PLEDGE_VIEW_PRESET_KEY: Record<string, string> = {
  default: "KYC capture",
  kyc: "KYC capture",
  "pledge-entry": "Pledge entry",
  "loan-disbursal": "Loan disbursal",
  interest: "Interest schemes",
  renewal: "Top-up / Renewal",
  foreclosure: "Foreclosure",
  auction: "Auction & P&L",
};

export default async function JewelleryGoldPledgePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawView = params.view;
  const view = typeof rawView === "string" ? rawView : Array.isArray(rawView) ? rawView[0] : "kyc";
  const presetKey = PLEDGE_VIEW_PRESET_KEY[view] ?? PLEDGE_VIEW_PRESET_KEY.default;

  return (
    <ModulePlaceholder
      title="Gold Pledge Loans"
      description="Disburse gold-secured loans, accrue interest, and manage pledged ornaments."
      presetKey={presetKey}
    />
  );
}
