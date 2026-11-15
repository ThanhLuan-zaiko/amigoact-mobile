import { PING_INTERVAL_MS, reconnectDelay } from "@/lib/chat";
import {
  ME,
  parseRealtimeFrame,
  type RealtimeData,
  TopicCounts,
} from "@/lib/realtime";

// Ported from amigoact-fe src/app/_components/realtime/client.ts. The browser
// "online" and "visibilitychange" events become an injected lifecycle (AppState
// in the app): the socket closes in the background and opens again in front.

export type RealtimeTicket =
  | { ok: true; ticket: string; url: string }
  | { ok: false; reason: "no_url" | "signed_out" | "failed" };

export type RealtimeStatus = "idle" | "connecting" | "live" | "offline";
export type TopicMessage = { kind: "event" | "revoked"; data: RealtimeData };
type TopicListener = (message: TopicMessage) => void;
// Called after every open; first is true for the first open since the app started.
type OpenListener = (first: boolean) => void;

// Tells the client when the app comes to the front (true) or goes away (false).
export type Lifecycle = (onChange: (active: boolean) => void) => () => void;

// The backend closes a socket after 30 minutes with 4408, so a new ticket is fetched at once.
const EXPIRED_CLOSE = 4408;
// A bad ticket, or a gateway that cannot reach the backend.
const UNAUTHORIZED_CLOSE = 4401;
// A socket that has not opened by then is given up, because a dropped connection can hang.
const OPEN_TIMEOUT_MS = 10_000;

// One socket for the whole app. It opens when the first component listens, so guests and
// screens without live parts never connect. Topics are subscribed while anyone listens.
export class RealtimeClient {
  private counts = new TopicCounts();
  private listeners = new Map<string, Set<TopicListener>>();
  private openListeners = new Set<OpenListener>();
  private statusListeners = new Set<() => void>();
  private socket: WebSocket | null = null;
  private status: RealtimeStatus = "idle";
  private started = false;
  private active = true;
  private connecting = false;
  private opens = 0;
  private attempt = 0;
  // A 4401 close gets one fresh ticket before the client gives up.
  private unauthorizedRetried = false;
  private stopLifecycle: (() => void) | undefined;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private openTimer: ReturnType<typeof setTimeout> | undefined;
  private pingTimer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly fetchTicket: () => Promise<RealtimeTicket>,
    private readonly lifecycle?: Lifecycle,
  ) {}

  getStatus = (): RealtimeStatus => this.status;

  subscribeStatus = (listener: () => void): (() => void) => {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  };

  listen(topic: string, listener: TopicListener): () => void {
    let set = this.listeners.get(topic);
    if (!set) {
      set = new Set();
      this.listeners.set(topic, set);
    }
    set.add(listener);
    if (this.counts.add(topic) && topic !== ME) {
      this.send({ op: "subscribe", topic });
    }
    this.start();
    return () => {
      set.delete(listener);
      if (this.counts.remove(topic) && topic !== ME) {
        this.send({ op: "unsubscribe", topic });
      }
    };
  }

  // Tells a subscribed room that the viewer is typing. Nothing is sent while offline or
  // for a topic nobody here listens to, because the backend accepts it only after subscribe.
  typing(topic: string): void {
    if (this.counts.has(topic)) {
      this.send({ op: "typing", topic });
    }
  }

  onOpen(listener: OpenListener): () => void {
    this.openListeners.add(listener);
    return () => this.openListeners.delete(listener);
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.stopLifecycle = this.lifecycle?.(this.onLifecycle);
    this.connect();
  }

  stop(): void {
    this.started = false;
    this.stopLifecycle?.();
    this.stopLifecycle = undefined;
    this.closeSocket();
    this.setStatus("idle");
  }

  // Signing in or out changes what the socket may hear, so it opens again.
  restart(): void {
    if (!this.started) return;
    this.closeSocket();
    this.attempt = 0;
    this.unauthorizedRetried = false;
    this.connect();
  }

  private closeSocket(): void {
    clearTimeout(this.retryTimer);
    clearTimeout(this.openTimer);
    clearInterval(this.pingTimer);
    const socket = this.socket;
    this.socket = null;
    socket?.close(1000);
  }

  private onLifecycle = (active: boolean): void => {
    this.active = active;
    if (!this.started) return;
    if (!active) {
      // The background closes the socket; the server would drop it anyway.
      this.closeSocket();
      this.setStatus("offline");
      return;
    }
    this.attempt = 0;
    this.scheduleRetry(0);
  };

  private setStatus(status: RealtimeStatus): void {
    if (this.status !== status) {
      this.status = status;
      for (const listener of this.statusListeners) listener();
    }
  }

  private send(body: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(body));
    }
  }

  private scheduleRetry(delay: number): void {
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.connect(), delay);
  }

  private async connect(): Promise<void> {
    if (!this.started || !this.active || this.socket || this.connecting) {
      return;
    }
    this.connecting = true;
    // After a failure the status stays "offline" while it retries; screens poll meanwhile.
    if (this.status !== "offline") this.setStatus("connecting");
    let ticket: RealtimeTicket;
    try {
      ticket = await this.fetchTicket();
    } catch {
      ticket = { ok: false, reason: "failed" };
    }
    this.connecting = false;
    if (!this.started || !this.active) return;
    if (!ticket.ok) {
      this.setStatus("offline");
      // Without an address or a session, only coming back to the app tries again.
      if (ticket.reason === "failed") {
        this.scheduleRetry(reconnectDelay(this.attempt++));
      }
      return;
    }
    this.open(`${ticket.url}?ticket=${encodeURIComponent(ticket.ticket)}`);
  }

  private open(address: string): void {
    const socket = new WebSocket(address);
    this.socket = socket;
    this.openTimer = setTimeout(() => socket.close(), OPEN_TIMEOUT_MS);
    socket.onopen = () => {
      clearTimeout(this.openTimer);
      this.attempt = 0;
      this.unauthorizedRetried = false;
      for (const topic of this.counts.remote()) {
        socket.send(JSON.stringify({ op: "subscribe", topic }));
      }
      this.pingTimer = setInterval(
        () => this.send({ op: "ping" }),
        PING_INTERVAL_MS,
      );
      this.setStatus("live");
      const first = this.opens === 0;
      this.opens += 1;
      for (const listener of this.openListeners) listener(first);
    };
    socket.onmessage = (event) => {
      if (typeof event.data === "string") this.dispatch(event.data);
    };
    socket.onclose = (event) => {
      clearTimeout(this.openTimer);
      clearInterval(this.pingTimer);
      if (this.socket !== socket) return;
      this.socket = null;
      if (!this.started) return;
      this.setStatus("offline");
      if (event.code === UNAUTHORIZED_CLOSE) {
        // One fresh ticket; after that only coming back to the app tries again.
        if (this.unauthorizedRetried) return;
        this.unauthorizedRetried = true;
        this.scheduleRetry(0);
        return;
      }
      this.scheduleRetry(
        event.code === EXPIRED_CLOSE ? 0 : reconnectDelay(this.attempt++),
      );
    };
  }

  private dispatch(text: string): void {
    const frame = parseRealtimeFrame(text);
    if (!frame || frame.kind === "other") return;
    if (frame.kind === "revoked") this.counts.drop(frame.topic);
    for (const listener of [...(this.listeners.get(frame.topic) ?? [])]) {
      listener({ kind: frame.kind, data: frame.data });
    }
  }
}
