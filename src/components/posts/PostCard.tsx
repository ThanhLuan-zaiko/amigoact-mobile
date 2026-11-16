import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { appPath } from "@/lib/appPath";
import { placedMediaIds } from "@/lib/postMedia";
import { postPath } from "@/lib/posts";
import { orgTagHref } from "@/lib/tagLinks";
import Icon from "../common/Icon";
import type { Post } from "../types";
import { mutedText, panel, tagChip, tagChipText } from "../ui";
import PostActions from "./PostActions";
import PostActivityRow from "./PostActivityRow";
import PostBody from "./PostBody";
import PostMediaView from "./PostMediaView";
import PostPreview from "./PostPreview";

const kindLabel: Record<Post["kind"], string> = {
  announcement: "Thông báo",
  discussion: "Thảo luận",
};

const visibilityLabel: Record<Post["visibility"], string> = {
  public: "Công khai",
  members: "Chỉ thành viên",
};

// Ported from the web PostCard. `linked` is false on the post screen itself;
// `manageable` turns off the edit, pin, hide and delete buttons.
export default function PostCard({
  post,
  actions,
  linked = true,
  manageable = true,
  showActivity = true,
}: {
  post: Post;
  actions?: ReactNode;
  linked?: boolean;
  manageable?: boolean;
  // False on the post screen, where the activity has its own tab.
  showActivity?: boolean;
}) {
  // A draft opens its edit form. A published post opens its own screen.
  const href =
    post.status === "draft"
      ? `${postPath(post.slug, post.id)}/edit`
      : postPath(post.slug, post.id);
  const isAnnouncement = post.kind === "announcement";
  // Files placed inside the body show there. The rest form a gallery after it.
  const placed = placedMediaIds(post.body);
  const gallery = (post.media ?? []).filter((item) => !placed.has(item.id));

  return (
    <View
      className={`${panel} gap-3 p-4 ${post.pinned ? "border-teal-700 dark:border-teal-400" : ""}`}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800">
          <Text className="font-body-semibold text-xs text-slate-700 dark:text-slate-300">
            {post.organizationInitials}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Pressable
            onPress={() => router.push(`/org/${post.slug}` as never)}
            accessibilityRole="link"
          >
            <Text
              numberOfLines={1}
              className="font-body-semibold text-sm text-slate-900 dark:text-slate-100"
            >
              {post.organizationName}
            </Text>
          </Pressable>
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text className={mutedText}>{post.publishedAt}</Text>
            <Icon
              name={post.visibility === "public" ? "globe" : "lock"}
              size={12}
              tone="subtle"
            />
            <Text className={mutedText}>
              {visibilityLabel[post.visibility]}
            </Text>
            {post.edited ? (
              <View accessible accessibilityLabel="Đã sửa">
                <Icon name="edit-3" size={12} tone="subtle" />
              </View>
            ) : null}
          </View>
        </View>
        {post.hidden ? (
          <View
            accessibilityLabel="Chỉ ban quản trị thấy bài này"
            className="flex-row items-center gap-1 rounded-sm bg-amber-50 px-2 py-0.5 dark:bg-amber-950/40"
          >
            <Icon name="eye-off" size={12} tone="warning" />
            <Text className="font-body-semibold text-xs text-amber-700 dark:text-amber-400">
              Đã ẩn
            </Text>
          </View>
        ) : null}
        <View
          className={`rounded-sm border px-2 py-0.5 ${
            isAnnouncement
              ? "border-slate-300 dark:border-slate-600"
              : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <Text
            className={`font-body-semibold text-xs ${
              isAnnouncement
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {kindLabel[post.kind]}
          </Text>
        </View>
      </View>

      {linked ? (
        <Pressable
          onPress={() => router.push(href as never)}
          accessibilityRole="link"
        >
          <Text className="font-body-semibold text-lg leading-snug text-slate-900 dark:text-slate-100">
            {post.title}
          </Text>
        </Pressable>
      ) : (
        <Text
          accessibilityRole="header"
          selectable
          className="font-body-semibold text-xl leading-snug text-slate-900 dark:text-slate-100"
        >
          {post.title}
        </Text>
      )}
      {linked ? (
        <PostPreview
          body={post.body}
          href={href}
          media={[
            ...[...placed].flatMap(
              (id) => post.media?.find((item) => item.id === id) ?? [],
            ),
            ...gallery,
          ]}
        />
      ) : (
        <PostBody body={post.body} media={post.media} />
      )}
      {!linked && gallery.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {gallery.map((item) => (
            <View key={item.id} className="w-[48.5%]">
              <PostMediaView item={item} tile />
            </View>
          ))}
        </View>
      ) : null}

      {post.activity && showActivity ? (
        <PostActivityRow activity={post.activity} />
      ) : null}

      <View className="flex-row flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
        {post.tags.map((tag) => (
          <Pressable
            key={tag}
            onPress={() =>
              router.push(appPath(orgTagHref(post.slug, tag)) as never)
            }
            accessibilityRole="link"
            accessibilityLabel={`Xem bài cùng thẻ ${tag}`}
            className={tagChip}
          >
            <Text className={tagChipText}>#{tag}</Text>
          </Pressable>
        ))}
        <View
          accessible
          accessibilityLabel={`${post.commentCount} bình luận`}
          className="ml-auto flex-row items-center gap-2"
        >
          <Icon name="message-circle" size={14} tone="subtle" />
          <Text className={mutedText}>{post.commentCount}</Text>
        </View>
        {linked && manageable && !actions ? (
          <PostActions post={post} inline />
        ) : null}
      </View>
      {actions}
    </View>
  );
}
