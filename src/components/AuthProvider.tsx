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
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Holds who is signed in. On start it restores the session from the tokens in
// the device keystore, so the app opens straight to the signed-in screens.
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
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((signedIn: User) => {
    setUser(signedIn);
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(async () => {
    await auth.logout();
    setUser(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
