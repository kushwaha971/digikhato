import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";

export default function JewelleryRootPage() {
  redirect(ROUTES.app.jewellery.dashboard);
}
