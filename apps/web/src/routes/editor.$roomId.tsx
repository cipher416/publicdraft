import {
  clearCollabHeader,
  updateCollabHeader,
} from "@/components/collaboration-header";
import { api } from "@/lib/api";
import { requireSessionBeforeLoad } from "@/lib/require-session";
import { createFileRoute } from "@tanstack/react-router";
import { EditorContent } from "@tiptap/react";
import type { WebsocketProvider } from "y-websocket";
import type { Doc } from "yjs";
import {
  useCollaborativeEditor,
  usePresence,
  useYjsSync,
} from "../hooks/use-collaboration";

export const Route = createFileRoute("/editor/$roomId")({
  component: EditorComponent,
  beforeLoad: requireSessionBeforeLoad,
  loader: async ({ params }) => {
    const { data, error } = await api.docs[params.roomId].get();

    if (error) {
      throw new Error(error.message || "Failed to load document");
    }

    if (!data) {
      throw new Error("Document not found");
    }

    return { doc: data };
  },
});

function EditorWithCursor({
  ydoc,
  provider,
  user,
  className,
}: {
  ydoc: Doc;
  provider: WebsocketProvider;
  user: { name: string; color: string };
  className?: string;
}) {
  const editor = useCollaborativeEditor({
    ydoc,
    provider,
    user,
  });

  return (
    <EditorContent
      editor={editor}
      className={`tiptap-editor prose prose-sm dark:prose-invert max-w-none ${className ?? ""}`}
    />
  );
}

function CollaborativeEditor({
  userName,
  roomId,
  title,
}: {
  userName: string;
  roomId: string;
  title?: string;
}) {
  const { ydoc, provider, status } = useYjsSync(roomId, {
    onStatusChange: (nextStatus) =>
      updateCollabHeader({ status: nextStatus, title: title || roomId }),
  });
  const { users, color } = usePresence(provider, {
    onChange: (nextUsers) =>
      updateCollabHeader({ users: nextUsers, title: title || roomId, status }),
  });

  const user = {
    name: userName,
    color,
  };

  if (!provider) {
    clearCollabHeader();
  } else if (title || roomId) {
    updateCollabHeader({ title: title || roomId, status, users });
  }

  if (!provider) {
    return (
      <div className="w-full rounded-xl border bg-card/70 p-6 text-sm text-muted-foreground shadow-xl ring-1 ring-border/60 backdrop-blur">
        Connecting...
      </div>
    );
  }

  return (
    <EditorWithCursor
      key={roomId}
      ydoc={ydoc}
      provider={provider}
      user={user}
      className="w-full h-full rounded-xl bg-card/70 bg-linear-to-b from-background/60 to-background/80 p-4 shadow-xl ring-1 ring-border/60 backdrop-blur overflow-y-auto "
    />
  );
}

function EditorComponent() {
  const { session } = Route.useRouteContext();
  const user = session.data!.user;
  const { roomId } = Route.useParams();
  const { doc } = Route.useLoaderData();

  return (
    <div className="mx-auto h-full w-full">
      <CollaborativeEditor
        userName={user.name || user.email}
        roomId={roomId}
        title={doc.title}
      />
    </div>
  );
}
