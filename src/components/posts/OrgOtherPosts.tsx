import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import { getOrgPosts } from "@/lib/postApi";
import { postPath } from "@/lib/posts";
import Icon from "../common/Icon";
import Picture from "../common/Picture";
import { IconStat, Loading } from "../common/States";
import { mutedText } from "../ui";

const OTHER_COUNT = 5;

// The web OrgOtherPosts, the "Bài viết khác" tab of a post: the
// organization's newest posts other than this one, each with its first picture.
export default function OrgOtherPosts({
  slug,
  postId,
}: {
  slug: string;
  postId: string;
}) {
  const page = useLoad(
    () => getOrgPosts(slug, "all", null, OTHER_COUNT + 1),
    [slug],
  );
  if (page.loading) return <Loading />;
  if (page.data === null) {
    return (
      <Text className={`p-4 ${mutedText}`}>
        Không tải được bài viết. Thử lại sau.
      </Text>
    );
  }
  const posts = (page.data?.posts ?? [])
    .filter((post) => post.id !== postId)
    .slice(0, OTHER_COUNT);
  return (
    <View>
      {posts.length === 0 ? (
        <Text className={`p-4 ${mutedText}`}>
          Tổ chức chưa có bài viết nào khác.
        </Text>
      ) : (
        posts.map((post, index) => {
          const picture = post.media?.find((item) => !item.isVideo);
          return (
            <Pressable
              key={post.id}
              onPress={() => router.push(postPath(slug, post.id) as never)}
              accessibilityRole="link"
              accessibilityLabel={post.title}
              className={`flex-row gap-3 p-4 active:bg-slate-50 dark:active:bg-slate-900 ${
                index > 0
                  ? "border-t border-slate-200 dark:border-slate-800"
                  : ""
              }`}
            >
              {picture ? (
                <Picture
                  src={picture.src}
                  width={320}
                  focus={picture.focus}
                  className="h-16 w-16 rounded-md"
                />
              ) : null}
              <View className="min-w-0 flex-1 gap-1">
                <Text
                  numberOfLines={2}
                  className="font-body-semibold text-sm text-slate-900 dark:text-slate-100"
                >
                  {post.title}
                </Text>
                <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                  <Text className={mutedText}>{post.publishedAt}</Text>
                  <IconStat icon="message-circle" label="Bình luận">
                    {post.commentCount}
                  </IconStat>
                </View>
              </View>
            </Pressable>
          );
        })
      )}
      <Pressable
        onPress={() => router.push(postPath(slug) as never)}
        accessibilityRole="link"
        className="min-h-11 flex-row items-center justify-center gap-1 border-t border-slate-200 p-3 dark:border-slate-800"
      >
        <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
          Xem tất cả bài viết
        </Text>
        <Icon name="chevron-right" tone="accent" />
      </Pressable>
    </View>
  );
}
