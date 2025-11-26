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

export type PresenceChangeHandler = (users: PresenceUser[]) => void;

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

export function useYjsSync(
  docName: string,
  options?: { onStatusChange?: (status: string) => void },
) {
  const [status, setStatus] = useState("disconnected");
  const [synced, setSynced] = useState(false);
  const doc = useMemo(() => new Doc(), [docName]);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    const wsProvider = new WebsocketProvider(
      "ws://localhost:3000",
      `collaboration/${docName}`,
      doc,
      { connect: true, disableBc: true },
    );

    providerRef.current = wsProvider;
    setProvider(wsProvider);
    const handleStatus = (event: { status: string }) => {
      console.log("WebSocket status:", event.status);
      setStatus(event.status);
      options?.onStatusChange?.(event.status);
    };
    wsProvider.on("status", handleStatus);

    const handleConnectionClose = (
      event: CloseEvent | null,
      _provider: WebsocketProvider,
    ) => {
      if (event?.code === 4009) {
        // Another session replaced this one; stop reconnect loop
        wsProvider.shouldConnect = false;
        wsProvider.disconnect();
        setStatus("blocked");
      }
    };

    wsProvider.on("connection-close", handleConnectionClose);

    const handleSync = (isSynced: boolean) => {
      console.log("Sync status:", isSynced);
      setSynced(isSynced);
    };
    wsProvider.on("sync", handleSync);

    return () => {
      // Clean up provider and doc for the previous room
      wsProvider.off("connection-close", handleConnectionClose);
      wsProvider.off("status", handleStatus);
      wsProvider.off("sync", handleSync);
      wsProvider.destroy();
      providerRef.current = null;
      setProvider(null);
      setSynced(false);
    };
  }, [docName, doc]);

  return { ydoc: doc, provider, status, synced };
}

export function usePresence(
  provider: WebsocketProvider | null,
  options?: { onChange?: PresenceChangeHandler },
) {
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
      options?.onChange?.(userList);
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
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          undoRedo: false,
        }),
        Collaboration.configure({
          fragment: ydoc.getXmlFragment("prosemirror"),
        }),
        ...(provider
          ? [
              CollaborationCursor.configure({
                provider,
                user,
              }),
            ]
          : []),
      ],
      editorProps: {
        attributes: {
          class: "tiptap-editor focus:outline-none",
          "data-placeholder": "Start writing together...",
        },
      },
      editable: Boolean(provider),
    },
    [provider, ydoc, user.name, user.color],
  );

  useEffect(() => {
    provider?.awareness.setLocalStateField("user", {
      name: user.name,
      color: user.color,
    });
  }, [provider, user.name, user.color]);

  return editor;
}
