import { updateCollabHeader } from "@/components/collaboration-header/index";
import { redirectIfAuthenticatedBeforeLoad } from "@/lib/require-session";
import { cn } from "@/lib/utils";
import { AuthView } from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/auth/$authView")({
  component: RouteComponent,
  beforeLoad: redirectIfAuthenticatedBeforeLoad,
});

function RouteComponent() {
  const { authView } = Route.useParams();

  const title = authView
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  updateCollabHeader({ title, status: undefined, users: [] });

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card px-6 py-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <FileText className="mb-2 h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold">PublicDraft</h1>
          <p className="text-muted-foreground text-sm">Collaborative editing</p>
        </div>
        <div className="flex flex-col gap-4">
          <AuthView pathname={authView} callbackURL="/" />
          <p
            className={cn(
              ["callback", "sign-out"].includes(authView) && "hidden",
              "text-muted-foreground text-center text-xs",
            )}
          >
            Powered by{" "}
            <a
              className="text-primary underline"
              href="https://better-auth.com"
              target="_blank"
              rel="noreferrer"
            >
              better-auth.
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
