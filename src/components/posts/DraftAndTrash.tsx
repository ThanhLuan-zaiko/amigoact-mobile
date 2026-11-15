import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import type { ActionResult } from "@/lib/actionResult";
import { formatDateTime } from "@/lib/activities";
import {
  deletePost,
  publishDraft,
  purgePost,
  restorePost,
} from "@/lib/postApi";
import { postPath, type TrashPostApi } from "@/lib/posts";
import ActionButton, { ConfirmAction, follow } from "../common/ActionButton";
import Button, { IconButton } from "../common/Button";
import { FormMessage } from "../FormParts";
import type { Post } from "../types";
import { mutedText, strongText } from "../ui";
import PostCard from "./PostCard";

function DraftActions({ post, back }: { post: Post; back: string }) {
  const [state, setState] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  async function publish() {
    setPending(true);
    const result = await publishDraft(post.slug, post.id);
    setPending(false);
    setState(result);
    follow(result);
  }
  return (
    <View className="gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
      <FormMessage state={state} />
      <View className="flex-row flex-wrap items-center gap-2">
        <Button icon="send" pending={pending} onPress={publish}>
          {pending ? "Đang đăng…" : "Đăng bài"}
        </Button>
        <IconButton
          icon="edit-2"
          label="Sửa bản nháp"
          onPress={() =>
            router.push(`${postPath(post.slug, post.id)}/edit` as never)
          }
        />
        <ConfirmAction
          action={() => deletePost(post.id, back)}
          label="Xóa bản nháp"
          icon="trash-2"
          title="Xóa bản nháp?"
          confirmLabel="Xóa vĩnh viễn"
        >
          <Text className={mutedText}>
            Bản nháp &quot;{post.title}&quot; sẽ bị xóa vĩnh viễn và không khôi
            phục được.
          </Text>
        </ConfirmAction>
      </View>
    </View>
  );
}

// `back` is where a delete returns to: the global drafts screen or one
// organization's.
export function DraftList({ posts, back }: { posts: Post[]; back: string }) {
  return (
    <View className="gap-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          actions={<DraftActions post={post} back={back} />}
        />
      ))}
    </View>
  );
}

const KIND_LABELS = { announcement: "Thông báo", discussion: "Thảo luận" };

// Restoring is safe, so it runs at once. Removing for good needs the title
// typed again, and only the owner sees that button.
export function TrashList({ items }: { items: TrashPostApi[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <View
          key={item.id}
          className={`flex-row flex-wrap items-start gap-3 py-3 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}`}
        >
          <View className="min-w-0 flex-1 basis-56 gap-1">
            <Text className={strongText}>{item.title}</Text>
            <Text className={mutedText}>
              {KIND_LABELS[item.kind]} · Xóa lúc{" "}
              {formatDateTime(item.deleted_at)}
              {item.deleted_by_name ? ` bởi ${item.deleted_by_name}` : ""}
            </Text>
            <Text className={mutedText}>
              Tự xóa vĩnh viễn vào {formatDateTime(item.purge_at)}
            </Text>
          </View>
          <View className="flex-row items-start gap-2">
            <ActionButton
              action={() => restorePost(item.id)}
              icon="rotate-ccw"
              label="Khôi phục"
            />
            {item.can_purge ? (
              <ConfirmAction
                action={() => purgePost(item.id)}
                label="Xóa vĩnh viễn"
                icon="trash-2"
                title="Xóa vĩnh viễn bài viết?"
                confirmLabel="Xóa vĩnh viễn"
                typeToConfirm={item.title}
              >
                <Text className={mutedText}>
                  Bài, bình luận và liên kết ảnh của bài sẽ bị xóa hẳn. Việc này
                  không hoàn tác được.
                </Text>
              </ConfirmAction>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
