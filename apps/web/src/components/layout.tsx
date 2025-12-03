import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { api } from "@/lib/api";
import { SignedIn, SignedOut, UserButton } from "@daveyplate/better-auth-ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CollaborationHeader } from "./collaboration-header/index";
import { CreateDocumentDialog } from "./create-document-dialog";
import { ThemeSwitcher } from "./kibo-ui/theme-switcher";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const {
    data: documents,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await api.docs.get();

      if (error) {
        toast.error(error.message || "Failed to load documents");
      }

      return data ?? [];
    },
  });

  const isEditor = location.pathname.startsWith("/editor/");

  return (
    <>
      <SignedIn>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center justify-between gap-2 px-2 py-1">
                <Link to="/">
                  <div className="flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    <span className="font-semibold">PublicDraft</span>
                  </div>
                </Link>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Documents</SidebarGroupLabel>
                <SidebarMenu>
                  {isLoading && (
                    <SidebarMenuItem>
                      <SidebarMenuButton disabled>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading documents</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {isError && !isLoading && (
                    <SidebarMenuItem>
                      <SidebarMenuButton disabled>
                        <span className="text-destructive">
                          Failed to load documents
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {!isLoading && !isError && documents?.length === 0 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton disabled>
                        <span>No documents yet</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {!isLoading &&
                    !isError &&
                    documents?.map((doc) => {
                      const isActive =
                        location.pathname === `/editor/${doc.roomId}`;

                      return (
                        <SidebarMenuItem key={doc.roomId}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                              to="/editor/$roomId"
                              params={{ roomId: doc.roomId }}
                            >
                              <span className="truncate">
                                {doc.title || doc.roomId}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <CreateDocumentDialog />
              <UserButton
                classNames={{
                  trigger: {
                    base: "bg-sidebar text-start text-sidebar-foreground border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  },
                }}
              />
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex h-svh flex-col">
            <header className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 sm:h-16 sm:flex-nowrap sm:gap-3 sm:px-4">
              <SidebarTrigger />
              <CollaborationHeader showPresence={isEditor} />
              <ThemeSwitcher />
            </header>
            <main className="w-full flex-1 overflow-y-auto px-3 pb-6 pt-3 sm:px-4 sm:pt-4 min-h-0">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>

      <SignedOut>
        <main className="min-h-svh">{children}</main>
      </SignedOut>
    </>
  );
}
