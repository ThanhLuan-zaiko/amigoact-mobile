import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@/lib/account";
import { auth } from "@/lib/client";

type Status = "loading" | "signedOut" | "signedIn";

type AuthContextValue = {
  status: Status;
  user: User | null;
  signIn: (user: User) => void;
  // Reads the account again, after the profile or the email changes.
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  // Ends every session of the account, as "Đăng xuất mọi thiết bị" on the web.
  signOutEverywhere: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Holds who is signed in. On start it restores the session from the tokens in
// the device keystore, so the app opens straight to the signed-in screens.
// Visitors browse the public screens, as on the web.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    auth.restore().then((restored) => {
      if (cancelled) return;
      setUser(restored);
      setStatus(restored ? "signedIn" : "signedOut");
    });
    // A refused refresh anywhere in the app ends the session here too.
    const stop = auth.onSessionEnded(() => {
      setUser(null);
      setStatus("signedOut");
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  const signIn = useCallback((signedIn: User) => {
    setUser(signedIn);
    setStatus("signedIn");
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await auth.restore();
    if (fresh) setUser(fresh);
  }, []);

  const signOut = useCallback(async () => {
    await auth.logout();
    setUser(null);
    setStatus("signedOut");
  }, []);

  const signOutEverywhere = useCallback(async () => {
    await auth.authed("/auth/logout-all", { method: "POST" });
    await auth.logout();
    setUser(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, refreshUser, signOut, signOutEverywhere }),
    [status, user, signIn, refreshUser, signOut, signOutEverywhere],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
