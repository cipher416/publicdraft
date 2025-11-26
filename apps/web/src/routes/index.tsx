import { updateCollabHeader } from "@/components/collaboration-header/index";
import { CreateDocumentDialog } from "@/components/create-document-dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { requireSessionBeforeLoad } from "@/lib/require-session";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  beforeLoad: requireSessionBeforeLoad,
});

function HomeComponent() {
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

  updateCollabHeader({ title: "Home", status: undefined, users: [] });
  return (
    <Empty className="min-h-[calc(100vh-6rem)] text-white">
      <EmptyHeader>
        <EmptyTitle>Welcome to PublicDraft</EmptyTitle>
        <EmptyDescription className="text-white/80">
          Select a draft to open or create a new one to start collaborating.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreateDocumentDialog />
      </EmptyContent>
    </Empty>
  );
}
