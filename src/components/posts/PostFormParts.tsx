import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { appPath } from "@/lib/appPath";
import type { PostKind } from "@/lib/posts";
import Button, { Chip } from "../common/Button";
import Icon from "../common/Icon";
import { fieldLabel, mutedText } from "../ui";

const KIND_LABELS: Record<PostKind, string> = {
  announcement: "Thông báo",
  discussion: "Thảo luận",
};

// The kind of a post. The kind of an existing post cannot change.
export function KindPicker({
  kinds,
  kind,
  locked,
  onChange,
}: {
  kinds: PostKind[];
  kind: PostKind;
  locked: boolean;
  onChange: (kind: PostKind) => void;
}) {
  return (
    <View className="gap-2">
      <Text className={fieldLabel}>Loại bài</Text>
      <View className="flex-row flex-wrap gap-2">
        {kinds.map((option) => (
          <Chip
            key={option}
            icon={option === "announcement" ? "bell" : "message-circle"}
            pressed={kind === option}
            onPress={() => {
              if (!locked) onChange(option);
            }}
          >
            {KIND_LABELS[option]}
          </Chip>
        ))}
      </View>
    </View>
  );
}

// The bottom row of the post form: the drafts link, "Lưu nháp" and the main
// button, as on the web.
export function PostFormFooter({
  draftsHref,
  showDraftButton,
  saving,
  pending,
  onDraft,
  onPublish,
}: {
  draftsHref: string;
  showDraftButton: boolean;
  // True when the post is published already, so the main button saves it.
  saving: boolean;
  pending: boolean;
  onDraft: () => void;
  onPublish: () => void;
}) {
  return (
    <View className="flex-row flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
      <View className="flex-1 flex-row flex-wrap items-center gap-2">
        <Text className={mutedText}>Bài nháp chỉ bạn nhìn thấy.</Text>
        <Pressable
          onPress={() => router.push(appPath(draftsHref) as never)}
          accessibilityRole="link"
          className="min-h-9 flex-row items-center gap-1"
        >
          <Icon name="file-text" size={14} tone="accent" />
          <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
            Bản nháp
          </Text>
        </Pressable>
      </View>
      {showDraftButton ? (
        <Button
          variant="neutral"
          icon="save"
          label="Lưu nháp"
          disabled={pending}
          onPress={onDraft}
        />
      ) : null}
      <Button
        icon={saving ? "save" : "send"}
        pending={pending}
        onPress={onPublish}
      >
        {pending ? "Đang lưu…" : saving ? "Lưu thay đổi" : "Đăng bài"}
      </Button>
    </View>
  );
}
