import { SignedIn, SignedOut, UserButton } from "@daveyplate/better-auth-ui";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export default function UserMenu() {
  return (
    <>
      <SignedIn>
        <UserButton
          classNames={{
            trigger: {
              base: "bg-sidebar text-sidebar-foreground border border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            },
            content: {
              base: "bg-sidebar text-sidebar-foreground border border-sidebar-border",
            },
          }}
        />
      </SignedIn>
      <SignedOut>
        <Button variant="outline" asChild>
          <Link to="/auth/$authView" params={{ authView: "sign-in" }}>
            Sign In
          </Link>
        </Button>
      </SignedOut>
    </>
  );
}
