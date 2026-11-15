import { type ReactNode, useEffect, useState } from "react";
import { AppState } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { API_URL, auth } from "@/lib/client";
import { realtimeSocketUrl } from "@/lib/realtime";
import { type Lifecycle, RealtimeClient, type RealtimeTicket } from "./client";
import { RealtimeContext } from "./hooks";

// A one-time ticket from the backend through the gateway, and the gateway's
// socket address. The access token never goes into the socket URL.
async function fetchTicket(): Promise<RealtimeTicket> {
  const url = realtimeSocketUrl(API_URL, undefined, undefined);
  if (!url) return { ok: false, reason: "no_url" };
  if (!auth.accessToken()) return { ok: false, reason: "signed_out" };
  const result = await auth.authed<{ ticket: string }>("/realtime/tickets", {
    method: "POST",
  });
  if (!result.ok) {
    return {
      ok: false,
      reason: result.status === 401 ? "signed_out" : "failed",
    };
  }
  return { ok: true, ticket: result.data.ticket, url };
}

// The socket closes in the background and opens again in the foreground.
const appLifecycle: Lifecycle = (onChange) => {
  const subscription = AppState.addEventListener("change", (state) =>
    onChange(state === "active"),
  );
  return () => subscription.remove();
};

// Holds the app's one socket, at the app root as the web holds it in the
// (app) layout. It connects only once something listens to a topic.
export default function RealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [client] = useState(
    () => new RealtimeClient(fetchTicket, appLifecycle),
  );
  useEffect(() => () => client.stop(), [client]);
  // A new viewer means new topics, so the socket opens again with a new ticket.
  const userId = user?.id ?? null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: restart on a new viewer only.
  useEffect(() => {
    client.restart();
  }, [client, userId]);
  return (
    <RealtimeContext.Provider value={client}>
      {children}
    </RealtimeContext.Provider>
  );
}
