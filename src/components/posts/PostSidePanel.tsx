import { Pressable, Text, View } from "react-native";
import type { Post } from "@/components/types";
import type { PostSideTab } from "@/lib/postActivity";
import Icon, { type IconName } from "../common/Icon";
import { panel } from "../ui";
import CommentSection from "./CommentSection";
import OrgOtherPosts from "./OrgOtherPosts";
import PostActivityPanel from "./PostActivityPanel";

const LABELS: Record<PostSideTab, { label: string; icon: IconName }> = {
  activity: { label: "Hoạt động", icon: "calendar" },
  comments: { label: "Bình luận", icon: "message-circle" },
  posts: { label: "Bài viết khác", icon: "file-text" },
};

// The web panel beside a post, under it on a phone: its activity, the
// comments, and the organization's other posts. The tab lives in the route
// params (?tab=), as the web keeps it in the address.
export default function PostSidePanel({
  post,
  slug,
  tabs,
  current,
  signedIn,
  onTab,
}: {
  post: Post;
  slug: string;
  tabs: PostSideTab[];
  current: PostSideTab;
  signedIn: boolean;
  onTab: (tab: PostSideTab) => void;
}) {
  return (
    <View className={`${panel} overflow-hidden`}>
      <View
        accessibilityRole="tablist"
        className="flex-row border-b border-slate-200 dark:border-slate-800"
      >
        {tabs.map((tab) => {
          const { label, icon } = LABELS[tab];
          const active = tab === current;
          const text =
            tab === "comments" ? `${label} (${post.commentCount})` : label;
          return (
            <Pressable
              key={tab}
              onPress={() => onTab(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={text}
              className={`min-h-11 min-w-0 flex-1 flex-row items-center justify-center gap-1 border-b-2 px-1 py-3 ${
                active
                  ? "border-teal-700 dark:border-teal-400"
                  : "border-transparent"
              }`}
            >
              <Icon name={icon} tone={active ? "accent" : "muted"} />
              <Text
                numberOfLines={1}
                className={`shrink font-body-semibold text-sm ${
                  active
                    ? "text-teal-700 dark:text-teal-400"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {text}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {current === "activity" && post.activity ? (
        <PostActivityPanel
          activity={post.activity}
          postPictureUrls={(post.media ?? []).map((item) => item.src)}
        />
      ) : current === "posts" ? (
        <OrgOtherPosts slug={slug} postId={post.id} />
      ) : (
        <CommentSection
          slug={slug}
          postId={post.id}
          canComment={post.viewer.can_comment}
          signedIn={signedIn}
        />
      )}
    </View>
  );
}
