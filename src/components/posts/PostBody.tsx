import { Text, View } from "react-native";
import { type BodyBlock, parseBody } from "@/lib/postFormat";
import type { PostMedia } from "../types";
import PostMediaView from "./PostMediaView";

const paragraph =
  "font-body text-base leading-7 text-slate-700 dark:text-slate-300";

function renderBlock(block: BodyBlock, index: number, media: PostMedia[]) {
  switch (block.type) {
    case "media": {
      // A token for a file the post no longer has renders nothing.
      const item = media.find((entry) => entry.id === block.id);
      return item ? <PostMediaView key={index} item={item} /> : null;
    }
    case "heading":
      return (
        <Text
          key={index}
          accessibilityRole="header"
          className="mt-2 font-body-semibold text-lg text-slate-900 dark:text-slate-100"
        >
          {block.text}
        </Text>
      );
    case "quote":
      return (
        <View
          key={index}
          className="border-l-2 border-slate-300 pl-3 dark:border-slate-700"
        >
          <Text className="font-body text-base leading-7 text-slate-600 dark:text-slate-400">
            {block.lines.join("\n")}
          </Text>
        </View>
      );
    case "list":
      return (
        <View key={index} className="gap-1 pl-2">
          {block.items.map((item, itemIndex) => (
            <View
              // biome-ignore lint/suspicious/noArrayIndexKey: the parsed list is static.
              key={`${index}-${itemIndex}`}
              className="flex-row gap-2"
            >
              <Text className={paragraph}>•</Text>
              <Text className={`flex-1 ${paragraph}`}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case "rule":
      return (
        <View key={index} className="h-px bg-slate-200 dark:bg-slate-800" />
      );
    default:
      return (
        <Text key={index} selectable className={paragraph}>
          {block.text}
        </Text>
      );
  }
}

// Plain text in, native elements out, the same parser as the web PostBody.
export default function PostBody({
  body,
  media = [],
}: {
  body: string;
  media?: PostMedia[];
}) {
  return (
    <View className="gap-3">
      {parseBody(body).map((block, index) => renderBlock(block, index, media))}
    </View>
  );
}
