import { View } from "react-native";
import { aspectClass } from "@/lib/aspectClasses";
import Picture from "../common/Picture";
import type { PostMedia } from "../types";
import VideoPlayer from "./VideoPlayer";

const FRAME =
  "overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900";

// One attached picture or video, ported from the web PostMediaView. Tiles
// (gallery and feed cover) fill a 16:9 box and crop around the focal point.
// Inline media keep their own shape: never cropped, only scaled to fit.
export default function PostMediaView({
  item,
  tile = false,
  cover = false,
}: {
  item: PostMedia;
  tile?: boolean;
  cover?: boolean;
}) {
  if (item.isVideo) {
    return (
      <View className={`${FRAME} aspect-video w-full bg-slate-950`}>
        <VideoPlayer id={item.id} info={item.video} className="h-full w-full" />
      </View>
    );
  }
  if (tile) {
    return (
      <View className={`${FRAME} aspect-video w-full`}>
        <Picture
          src={item.src}
          width={cover ? 1080 : 640}
          placeholder={item.placeholder}
          focus={item.focus}
          className="h-full w-full"
        />
      </View>
    );
  }
  return (
    // The picture keeps its own shape, from its stored size.
    <View className={`${FRAME} w-full ${aspectClass(item.width, item.height)}`}>
      <Picture
        src={item.src}
        placeholder={item.placeholder}
        fit="contain"
        className="h-full w-full"
      />
    </View>
  );
}
