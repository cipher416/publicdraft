import { updateCollabHeader } from "@/components/collaboration-header/index";
import type { CollabHeaderState } from "@/components/collaboration-header/store";
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

const ACCOUNT_HEADER_STATE: Partial<CollabHeaderState> = {
  title: "Account Settings",
  status: undefined,
  users: [],
};

function RouteComponent() {
  updateCollabHeader(ACCOUNT_HEADER_STATE);

  return (
    <main className="container flex-col space-y-4 p-4 md:p-6">
      <AccountSettingsCards />
      <SecuritySettingsCards />
      <DeleteAccountCard />
    </main>
  );
}
