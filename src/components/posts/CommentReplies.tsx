import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getReplies } from "@/lib/postApi";
import type { CommentApi } from "@/lib/posts";
import { onInvalidate } from "@/lib/refreshBus";
import Icon from "../common/Icon";
import { Loading } from "../common/States";
import { mutedText } from "../ui";
import CommentRow from "./CommentRow";

function Toggle({
  label,
  onPress,
  up = false,
}: {
  label: string;
  onPress: () => void;
  up?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="min-h-8 flex-row items-center gap-1 self-start"
    >
      <Text className="font-body-semibold text-xs text-slate-500 dark:text-slate-400">
        {label}
      </Text>
      <Icon name={up ? "chevron-up" : "chevron-down"} size={14} tone="subtle" />
    </Pressable>
  );
}

// The web CommentReplies: the replies under a top-level comment, shut until
// someone opens them. A new reply in this thread opens it and reads it again.
export default function CommentReplies({
  root,
  signedIn,
  onReply,
  version,
}: {
  root: CommentApi;
  signedIn: boolean;
  onReply?: (name: string) => void;
  version: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CommentApi[] | null>(null);
  const [failed, setFailed] = useState(false);
  const count = root.reply_count ?? 0;

  async function read() {
    setFailed(false);
    try {
      const page = await getReplies(root.id, null);
      setItems(page?.items ?? []);
      setFailed(page === null);
    } catch {
      setFailed(true);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: only a new reply here opens the thread.
  useEffect(() => {
    if (version > 0) {
      setOpen(true);
      read();
    }
  }, [version]);

  // Any change on the screen (a delete, an edit) reads an open thread again.
  // biome-ignore lint/correctness/useExhaustiveDependencies: read is stable enough here.
  useEffect(() => (open ? onInvalidate(() => read()) : undefined), [open]);

  if (count === 0 && !open) return null;
  if (!open) {
    return (
      <View className="ml-12">
        <Toggle
          label={`Xem ${count} câu trả lời`}
          onPress={() => {
            setOpen(true);
            read();
          }}
        />
      </View>
    );
  }
  return (
    <View className="ml-12 gap-3">
      {items === null ? (
        <Loading />
      ) : (
        items.map((reply) => (
          <CommentRow
            key={reply.id}
            comment={reply}
            signedIn={signedIn}
            onReply={onReply ? () => onReply(reply.author_name) : undefined}
            small
          />
        ))
      )}
      {failed ? (
        <Text className={mutedText}>Không tải được câu trả lời.</Text>
      ) : null}
      <Toggle label="Ẩn" onPress={() => setOpen(false)} up />
    </View>
  );
}
