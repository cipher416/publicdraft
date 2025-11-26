import { cn } from "@/lib/utils";
import { FileTextIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { AvatarStack } from "../kibo-ui/avatar-stack";
import {
  getSnapshot,
  resetHeaderState,
  setHeaderState,
  subscribe,
  type CollabHeaderState,
} from "./store";
import type { PresenceSummary } from "./types";

export function useCollabHeaderState(): CollabHeaderState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function updateCollabHeader(partial: Partial<CollabHeaderState>) {
  resetHeaderState();
  setHeaderState(partial);
}

export function clearCollabHeader() {
  resetHeaderState();
}

interface CollaborationHeaderProps {
  className?: string;
  showPresence?: boolean;
}

export function CollaborationHeader({
  className,
  showPresence = true,
}: CollaborationHeaderProps) {
  const { title, status, users } = useCollabHeaderState();

  const statusColor =
    status === "connected"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40"
      : status === "blocked"
        ? "bg-rose-500/15 text-rose-200 ring-rose-400/40"
        : "bg-amber-500/15 text-amber-200 ring-amber-400/40";

  return (
    <>
      {showPresence ? (
        <div
          className={cn(
            "flex w-full flex-wrap items-center gap-2 rounded-lg px-2 py-2 shadow-sm  backdrop-blur sm:gap-3 sm:px-3",
            className,
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <FileTextIcon className="shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <span className="truncate text-sm font-semibold sm:text-base">
                {title}
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <StatusPill status={status} statusColor={statusColor} />
            <AvatarStackDisplay users={users} />
            <MobilePresence users={users} />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex w-full flex-wrap items-center gap-2 rounded-lg px-2 py-2 shadow-sm backdrop-blur sm:gap-3 sm:px-3",
            className,
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0">
              <span className="truncate text-sm font-semibold sm:text-base">
                {title}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatusPill({
  status,
  statusColor,
}: {
  status?: string;
  statusColor: string;
}) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1",
        statusColor,
      )}
    >
      {status ? status : "idle"}
    </span>
  );
}

function AvatarStackDisplay({ users }: { users: PresenceSummary[] }) {
  if (!users.length) return null;

  return (
    <div className="hidden min-w-0 items-center sm:flex">
      <AvatarStack size={32} className="-space-x-2">
        {users.slice(0, 6).map((user) => (
          <div
            key={user.id}
            data-slot="avatar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 text-[11px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {users.length > 6 && (
          <div
            data-slot="avatar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/60 text-[11px] font-semibold text-muted-foreground"
          >
            +{users.length - 6}
          </div>
        )}
      </AvatarStack>
    </div>
  );
}

function MobilePresence({ users }: { users: PresenceSummary[] }) {
  if (!users.length) {
    return (
      <div className="flex items-center text-[11px] text-muted-foreground sm:hidden">
        Waiting…
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[11px] sm:hidden">
      <div
        className="flex h-6 w-6 items-center justify-center rounded-full border border-border/70 text-[10px] font-semibold text-white"
        style={{ backgroundColor: users[0].color }}
        title={users[0].name}
      >
        {users[0].name.charAt(0).toUpperCase()}
      </div>
      <span className="text-muted-foreground">{users.length} online</span>
    </div>
  );
}
