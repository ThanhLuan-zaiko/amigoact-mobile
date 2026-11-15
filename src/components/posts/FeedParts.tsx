import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { FeedFilter } from "@/lib/posts";
import { Chip } from "../common/Button";
import Icon from "../common/Icon";
import Segments from "../common/Segments";
import EmptyState from "../common/States";
import type { Post } from "../types";
import { chipButton, chipText, mutedText, panel } from "../ui";
import PostCard from "./PostCard";

// Ported from the web FeedList: the posts, or the empty state that fits.
export function FeedList({
  posts,
  filtered = false,
  manageable = false,
}: {
  posts: Post[];
  // True when the list is filtered by a tag, so the empty message says so.
  filtered?: boolean;
  manageable?: boolean;
}) {
  if (posts.length === 0) {
    return filtered ? (
      <EmptyState
        title="Chưa có bài với thẻ này"
        description="Thử tab khác hoặc bỏ lọc thẻ để xem mọi bài."
      />
    ) : (
      <EmptyState
        title="Chưa có bài viết"
        description="Bài viết từ các tổ chức bạn theo dõi sẽ hiện ở đây."
      />
    );
  }
  return (
    <View className="gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} manageable={manageable} />
      ))}
    </View>
  );
}

// Ported from the web Composer on the home feed. Every entry opens /compose,
// which picks the organization to post in.
export function Composer({ postingAs }: { postingAs?: string }) {
  const open = () => router.push("/compose");
  return (
    <View className={`${panel} gap-3 p-4`}>
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800">
          <Icon name="user" />
        </View>
        <Pressable
          onPress={open}
          accessibilityRole="link"
          className="h-11 flex-1 justify-center rounded-md border border-slate-200 px-4 active:border-teal-700 dark:border-slate-800 dark:active:border-teal-400"
        >
          <Text className="font-body text-sm text-slate-500 dark:text-slate-400">
            Bạn muốn chia sẻ điều gì?
          </Text>
        </Pressable>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Pressable
          onPress={open}
          accessibilityRole="link"
          className={chipButton}
        >
          <Icon name="bell" size={14} />
          <Text className={chipText}>Thông báo</Text>
        </Pressable>
        <Pressable
          onPress={open}
          accessibilityRole="link"
          className={chipButton}
        >
          <Icon name="message-circle" size={14} />
          <Text className={chipText}>Thảo luận</Text>
        </Pressable>
        <Text className={`ml-auto ${mutedText}`}>
          {postingAs ?? "Chưa chọn tổ chức"}
        </Text>
      </View>
    </View>
  );
}

// Narrows the home feed to the viewer's organizations. A tag filter stays on.
export function ScopeToggle({
  mine,
  onToggle,
}: {
  mine: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="self-start">
      <Chip icon="user-check" pressed={mine} onPress={onToggle}>
        Tổ chức của tôi
      </Chip>
    </View>
  );
}

// Shown above a list filtered by a tag. The cross goes back to the whole list.
export function TagFilterBar({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="min-w-0 flex-row items-center gap-1 rounded-md border border-teal-700 bg-teal-50 py-1 pl-2 pr-1 dark:border-teal-400 dark:bg-teal-950/40">
        <Icon name="hash" size={14} tone="accent" />
        <Text
          numberOfLines={1}
          className="shrink font-body-semibold text-sm text-teal-700 dark:text-teal-400"
        >
          {label}
        </Text>
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={`Bỏ lọc thẻ ${label}`}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-sm active:bg-teal-100 dark:active:bg-teal-900/40"
        >
          <Icon name="x" size={14} tone="accent" />
        </Pressable>
      </View>
    </View>
  );
}

const FILTERS: Parameters<typeof Segments<FeedFilter>>[0]["items"] = [
  { value: "all", label: "Tất cả", icon: "list" },
  { value: "announcement", label: "Thông báo", icon: "bell" },
  { value: "discussion", label: "Thảo luận", icon: "message-circle" },
  { value: "pinned", label: "Đã ghim", icon: "bookmark" },
];

// The kind filter of an organization's posts. A tag filter stays on.
export function FeedFilters({
  current,
  onChange,
}: {
  current: FeedFilter;
  onChange: (filter: FeedFilter) => void;
}) {
  return (
    <Segments
      items={FILTERS}
      current={current}
      onChange={onChange}
      label="Lọc bài viết"
      compact
    />
  );
}
