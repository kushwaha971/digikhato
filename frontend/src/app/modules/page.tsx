import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function ModulesPage() {
  redirect(ROUTES.app.loans.dashboard);
}
