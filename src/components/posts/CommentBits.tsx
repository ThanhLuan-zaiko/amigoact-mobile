import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { setCommentLike } from "@/lib/commentApi";
import { initials } from "@/lib/organizations";
import { compactCount, relativeTime } from "@/lib/relativeTime";
import Icon, { ExtraIcon } from "../common/Icon";
import Picture from "../common/Picture";

// The web CommentAvatar: a round picture of the author, or their initials.
export function CommentAvatar({
  name,
  url,
  small = false,
}: {
  name: string;
  url?: string | null;
  small?: boolean;
}) {
  const size = small ? "h-7 w-7" : "h-9 w-9";
  if (url) {
    return (
      <Picture
        src={url}
        width={320}
        className={`${size} rounded-full border border-slate-200 dark:border-slate-800`}
      />
    );
  }
  return (
    <View
      className={`${size} items-center justify-center rounded-full border border-slate-200 dark:border-slate-800`}
    >
      <Text
        className={`font-body-semibold text-slate-600 dark:text-slate-300 ${small ? "text-[10px]" : "text-xs"}`}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

// The web CommentTime: the age of a comment in the phone's own time zone,
// moving on every minute.
export function CommentTime({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Text className="text-xs text-slate-500 dark:text-slate-400">
      {relativeTime(iso, now)}
    </Text>
  );
}

// The web CommentLike: the heart on the right. It changes at once; a failed
// request puts it back.
export function CommentLike({
  commentId,
  liked,
  count,
  canLike,
}: {
  commentId: string;
  liked: boolean;
  count: number;
  canLike: boolean;
}) {
  const [state, setState] = useState({ liked, count });
  const [pending, setPending] = useState(false);
  useEffect(() => setState({ liked, count }), [liked, count]);

  async function toggle() {
    const previous = state;
    const next = {
      liked: !state.liked,
      count: Math.max(0, state.count + (state.liked ? -1 : 1)),
    };
    setState(next);
    setPending(true);
    try {
      const result = await setCommentLike(commentId, next.liked);
      if (result.error) setState(previous);
    } catch {
      setState(previous);
    } finally {
      setPending(false);
    }
  }

  const label = canLike
    ? state.liked
      ? "Bỏ thích"
      : "Thích"
    : "Đăng nhập để thích";
  return (
    <Pressable
      onPress={toggle}
      disabled={!canLike || pending}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: state.liked }}
      className="min-h-11 w-11 items-center justify-start gap-0.5 pt-1"
    >
      {state.liked ? (
        <ExtraIcon name="heart" size={18} tone="accent" />
      ) : (
        <Icon name="heart" size={18} tone="subtle" />
      )}
      {state.count > 0 ? (
        <Text
          className={`text-xs ${state.liked ? "text-teal-700 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"}`}
        >
          {compactCount(state.count)}
        </Text>
      ) : null}
    </Pressable>
  );
}
