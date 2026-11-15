import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { bodyExcerpt } from "@/lib/postFormat";
import Icon from "../common/Icon";
import type { PostMedia } from "../types";
import PostMediaView from "./PostMediaView";

// The short form of a post in a list: a few lines of text, one picture, and a
// link to the full post. The post screen shows everything.
export default function PostPreview({
  body,
  media,
  href,
}: {
  body: string;
  media: PostMedia[];
  href: string;
}) {
  const excerpt = bodyExcerpt(body);
  const [cover, ...rest] = media;
  const open = () => router.push(href as never);
  return (
    <View className="gap-3">
      {excerpt ? (
        <Text
          numberOfLines={3}
          className="font-body text-[15px] leading-relaxed text-slate-700 dark:text-slate-300"
        >
          {excerpt}
        </Text>
      ) : null}
      {cover ? (
        cover.isVideo ? (
          <PostMediaView item={cover} tile cover />
        ) : (
          <Pressable
            onPress={open}
            accessibilityRole="link"
            accessibilityLabel="Xem bài"
            className="relative"
          >
            <PostMediaView item={cover} tile cover />
            {rest.length > 0 ? (
              <View className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-md bg-slate-900/70 px-2 py-1">
                <Icon name="image" size={12} tone="onDanger" />
                <Text className="font-body-semibold text-xs text-white">
                  +{rest.length}
                </Text>
              </View>
            ) : null}
          </Pressable>
        )
      ) : null}
      <Pressable
        onPress={open}
        accessibilityRole="link"
        className="min-h-9 flex-row items-center gap-2 self-start"
      >
        <Icon name="eye" size={14} tone="accent" />
        <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
          Xem thêm
        </Text>
      </Pressable>
    </View>
  );
}
