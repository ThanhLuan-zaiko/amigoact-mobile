import { Redirect, usePathname } from "expo-router";
import type { ReactNode } from "react";
import type { User } from "@/lib/account";
import { useAuth } from "./AuthProvider";

// The native counterpart of the web requireUser and the protected paths in
// proxy.ts: a visitor is sent to the login screen, which comes back here after
// signing in.
export default function RequireUser({
  children,
}: {
  children: (user: User) => ReactNode;
}) {
  const { status, user } = useAuth();
  const pathname = usePathname();
  if (status === "loading") return null;
  if (!user) {
    return (
      <Redirect href={{ pathname: "/login", params: { next: pathname } }} />
    );
  }
  return children(user);
}
