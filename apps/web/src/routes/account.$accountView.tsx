import { requireSessionBeforeLoad } from "@/lib/require-session";
import {
  AccountSettingsCards,
  DeleteAccountCard,
  SecuritySettingsCards,
} from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/account/$accountView")({
  component: RouteComponent,
  beforeLoad: requireSessionBeforeLoad,
});

function RouteComponent() {
  const { accountView } = Route.useParams();

  return (
    <main className="container flex-col space-y-4 p-4 md:p-6">
      <AccountSettingsCards />
      <SecuritySettingsCards />
      <DeleteAccountCard />
    </main>
  );
}
