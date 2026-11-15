import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { attempt, type ChatMessage, messageDay, messageTime } from "@/lib/chat";
import { loadPins } from "@/lib/chatApi";
import Icon from "../common/Icon";
import { errorText, mutedText, smallMuted } from "../ui";

type PinsState =
  | { status: "loading" }
  | { status: "ready"; items: ChatMessage[] }
  | { status: "failed"; error: string };

// The pinned messages of a room, ported from the web PinsPanel.
export default function PinsPanel({ roomId }: { roomId: string }) {
  const [state, setState] = useState<PinsState>({ status: "loading" });
  useEffect(() => {
    let active = true;
    attempt(() => loadPins(roomId)).then((result) => {
      if (!active) return;
      setState(
        result.ok
          ? { status: "ready", items: result.data }
          : { status: "failed", error: result.error },
      );
    });
    return () => {
      active = false;
    };
  }, [roomId]);

  return (
    <ScrollView
      accessibilityLabel="Tin đã ghim"
      className="max-h-60 grow-0 border-b border-slate-200 dark:border-slate-800"
      contentContainerClassName="gap-2 p-3"
    >
      <View className="flex-row items-center gap-2">
        <Icon name="bookmark" size={14} tone="muted" />
        <Text className="font-body-semibold text-sm text-slate-700 dark:text-slate-300">
          Tin đã ghim
        </Text>
      </View>
      {state.status === "loading" ? (
        <Text className={mutedText}>Đang tải…</Text>
      ) : state.status === "failed" ? (
        <Text className={errorText}>{state.error}</Text>
      ) : state.items.length === 0 ? (
        <Text className={mutedText}>Chưa có tin nào được ghim.</Text>
      ) : (
        state.items.map((message, index) => (
          <View
            key={message.id}
            className={`gap-0.5 py-2 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}`}
          >
            <Text className={smallMuted}>
              <Text className="font-body-semibold">{message.author_name}</Text>{" "}
              · {messageDay(message.created_at)}{" "}
              {messageTime(message.created_at)}
            </Text>
            <Text
              numberOfLines={3}
              className="font-body text-sm text-slate-800 dark:text-slate-200"
            >
              {message.body || "Ảnh hoặc video"}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
