import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
}

const COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function useYjsSync(docName: string) {
  const [status, setStatus] = useState("disconnected");
  const [synced, setSynced] = useState(false);
  const doc = useMemo(() => new Doc(), [docName]);
  const provider = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    const wsProvider = new WebsocketProvider(
      "ws://localhost:3000",
      `collaboration/${docName}`,
      doc,
      { connect: true },
    );

    provider.current = wsProvider;

    wsProvider.on("status", (event: { status: string }) => {
      console.log("WebSocket status:", event.status);
      setStatus(event.status);
    });

    wsProvider.on("sync", (isSynced: boolean) => {
      console.log("Sync status:", isSynced);
      setSynced(isSynced);
    });

    return () => {
      // Clean up provider and doc for the previous room
      wsProvider.destroy();
      provider.current = null;
      setSynced(false);
    };
  }, [docName, doc]);

  return { ydoc: doc, provider: provider.current, status, synced };
}

export function usePresence(provider: WebsocketProvider | null) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [color] = useState(() => getRandomColor());

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;

    const updateUsers = () => {
      const states = awareness.getStates();
      const userList: PresenceUser[] = [];

      states.forEach((state, clientId) => {
        if (state.user && state.user.name) {
          userList.push({
            id: String(clientId),
            name: state.user.name,
            color: state.user.color || color,
          });
        }
      });

      setUsers(userList);
    };

    awareness.on("change", updateUsers);

    updateUsers();

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [provider, color]);

  return { users, color };
}

interface CollaborativeEditorOptions {
  ydoc: Doc;
  provider: WebsocketProvider;
  user: {
    name: string;
    color: string;
  };
}

export function useCollaborativeEditor({
  ydoc,
  provider,
  user,
}: CollaborativeEditorOptions) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Collaboration.configure({
        fragment: ydoc.getXmlFragment("prosemirror"),
      }),
      CollaborationCursor.configure({
        provider,
        user,
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  useEffect(() => {
    provider.awareness.setLocalStateField("user", {
      name: user.name,
      color: user.color,
    });
  }, [provider, user.name, user.color]);

  return editor;
}
