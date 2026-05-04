import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";

export default function LegacyJewelleryPledgePage() {
  redirect(ROUTES.app.jewellery.pledge);
}
