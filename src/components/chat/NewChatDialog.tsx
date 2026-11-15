import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { attempt, type ChatContact, type ChatResult } from "@/lib/chat";
import { loadContacts } from "@/lib/chatApi";
import { foldText } from "@/lib/messenger";
import Icon from "../common/Icon";
import Sheet from "../common/Sheet";
import { Loading } from "../common/States";
import {
  errorText,
  inputField,
  mutedText,
  smallMuted,
  strongText,
} from "../ui";
import ChatAvatar from "./ChatAvatar";

type Contacts =
  | { status: "loading" }
  | { status: "ready"; items: ChatContact[] }
  | { status: "failed"; error: string };

// Picks a person to message, ported from the web NewChatDialog. A direct
// message belongs to one organization the two share, so someone met in two
// organizations appears once for each.
export default function NewChatDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (slug: string, userId: string) => Promise<ChatResult>;
}) {
  const theme = useThemeColors();
  const [contacts, setContacts] = useState<Contacts>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setContacts({ status: "loading" });
    attempt(() => loadContacts()).then((result) => {
      if (active) {
        setContacts(
          result.ok
            ? { status: "ready", items: result.data }
            : { status: "failed", error: result.error },
        );
      }
    });
    return () => {
      active = false;
    };
  }, [open]);

  const needle = foldText(query.trim());
  const shown =
    contacts.status === "ready"
      ? contacts.items.filter(
          (item) =>
            !needle ||
            foldText(item.full_name).includes(needle) ||
            foldText(item.org.name).includes(needle),
        )
      : [];

  async function pick(contact: ChatContact) {
    setPending(true);
    const result = await onPick(contact.org.slug, contact.user_id);
    setPending(false);
    setError(result.ok ? null : result.error);
  }

  return (
    <Sheet open={open} title="Tin nhắn mới" onClose={onClose}>
      <View className="justify-center">
        <View className="absolute left-3 z-10">
          <Icon name="search" tone="subtle" />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Tìm người"
          placeholder="Tìm theo tên hoặc tổ chức"
          placeholderTextColor={theme.subtle}
          className={`${inputField} pl-9`}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" className={errorText}>
          {error}
        </Text>
      ) : null}
      {contacts.status === "loading" ? (
        <Loading />
      ) : contacts.status === "failed" ? (
        <Text className={errorText}>{contacts.error}</Text>
      ) : shown.length === 0 ? (
        <Text className={mutedText}>
          {contacts.items.length === 0
            ? "Chưa có ai để nhắn. Hãy tham gia một tổ chức."
            : "Không tìm thấy ai."}
        </Text>
      ) : (
        <View className="gap-0.5">
          {shown.map((contact) => (
            <Pressable
              key={`${contact.org.id}:${contact.user_id}`}
              disabled={pending}
              onPress={() => pick(contact)}
              accessibilityRole="button"
              className={`min-h-11 flex-row items-center gap-3 rounded-lg px-3 py-2 active:bg-slate-50 dark:active:bg-slate-900/60 ${pending ? "opacity-50" : ""}`}
            >
              <ChatAvatar
                name={contact.full_name}
                url={contact.avatar_url}
                size="sm"
              />
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className={strongText}>
                  {contact.full_name}
                </Text>
                <Text numberOfLines={1} className={smallMuted}>
                  {contact.org.name}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Sheet>
  );
}
