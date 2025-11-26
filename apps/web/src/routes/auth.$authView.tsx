import { updateCollabHeader } from "@/components/collaboration-header/index";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";
import { redirectIfAuthenticatedBeforeLoad } from "@/lib/require-session";
import { cn } from "@/lib/utils";
import { AuthView } from "@daveyplate/better-auth-ui";
import { Dithering } from "@paper-design/shaders-react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/auth/$authView")({
  component: RouteComponent,
  beforeLoad: redirectIfAuthenticatedBeforeLoad,
});

function RouteComponent() {
  const { authView } = Route.useParams();
  const [viewport, setViewport] = useState({ width: 1600, height: 900 });

  useEffect(() => {
    const update = () =>
      setViewport({
        width: window.innerWidth || 1600,
        height: window.innerHeight || 900,
      });

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const title = authView
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  updateCollabHeader({ title, status: undefined, users: [] });

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 py-10 text-white">
      <ThemeSwitcher className="absolute top-2 right-2 z-10" />
      <div className="pointer-events-none absolute inset-0">
        <Dithering
          width={viewport.width}
          height={viewport.height}
          colorBack="#000000"
          colorFront="#333333"
          shape="simplex"
          type="4x4"
          size={3}
          speed={1}
          scale={0.8}
          className="h-full w-full opacity-80 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/80" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border bg-card px-6 py-8 text-foreground shadow-lg">
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
