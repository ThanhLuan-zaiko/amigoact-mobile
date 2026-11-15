import { useVideoPlayer, VideoView } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import type { ChatAttachment } from "@/lib/chat";
import { gatewayUrl, mediaSource } from "@/lib/http";
import { albumTiles, fileSize } from "@/lib/messenger";
import { transcodedUrl } from "@/lib/video";
import Icon from "../common/Icon";
import Picture from "../common/Picture";

const Safe = withUniwind(SafeAreaView);
const StyledVideo = withUniwind(VideoView);

function Thumb({ file, fill }: { file: ChatAttachment; fill: boolean }) {
  const size = fill ? "h-full w-full" : "h-64 w-full";
  if (file.kind === "video") {
    return (
      <View className={`${size} items-center justify-center bg-slate-900`}>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-950/60">
          <Icon name="play" size={20} tone="onDanger" />
        </View>
      </View>
    );
  }
  return <Picture src={file.url} width={640} className={size} />;
}

// Pictures and videos of one message, ported from the web MediaAlbum: one file
// on its own, more as a grid of up to four tiles.
export function MediaAlbum({
  files,
  onOpen,
}: {
  files: ChatAttachment[];
  onOpen: (index: number) => void;
}) {
  if (files.length === 0) return null;
  if (files.length === 1) {
    const [file] = files;
    return (
      <Pressable
        onPress={() => onOpen(0)}
        accessibilityRole="button"
        accessibilityLabel={file.kind === "video" ? "Xem video" : "Xem ảnh"}
        className="w-full overflow-hidden rounded-lg"
      >
        <Thumb file={file} fill={false} />
      </Pressable>
    );
  }
  return (
    <View className="flex-row flex-wrap gap-0.5 overflow-hidden rounded-lg">
      {albumTiles(files).map(({ file, index, wide, more }) => (
        <Pressable
          key={file.id}
          onPress={() => onOpen(index)}
          accessibilityRole="button"
          accessibilityLabel={`${file.kind === "video" ? "Xem video" : "Xem ảnh"} ${index + 1}/${files.length}`}
          className={`relative overflow-hidden ${wide ? "aspect-video w-full" : "aspect-square w-[49.6%]"}`}
        >
          <Thumb file={file} fill />
          {more > 0 ? (
            <View className="absolute inset-0 items-center justify-center bg-slate-950/60">
              <Text className="font-body-semibold text-2xl text-white">
                +{more}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

function ViewerVideo({ url }: { url: string }) {
  const source = mediaSource(transcodedUrl(url));
  const player = useVideoPlayer(
    { uri: source.uri, headers: source.headers },
    (created) => {
      created.play();
    },
  );
  return (
    <StyledVideo
      player={player}
      nativeControls
      contentFit="contain"
      className="h-full w-full"
    />
  );
}

// A full-screen viewer for the files of one message, ported from the web MediaViewer.
export function MediaViewer({
  files,
  start,
  caption,
  onClose,
}: {
  files: ChatAttachment[];
  start: number;
  caption: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start);
  const file = files[index];
  const many = files.length > 1;
  if (!file) return null;
  const move = (step: number) =>
    setIndex((current) => (current + step + files.length) % files.length);
  const control =
    "h-11 w-11 items-center justify-center rounded-full active:bg-white/10";
  return (
    <Modal
      visible
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Safe className="flex-1 bg-slate-950">
        <View className="flex-row items-center gap-2 p-2">
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 px-2 font-body text-sm text-slate-300"
          >
            {many ? `${index + 1}/${files.length} · ` : ""}
            {file.name ?? (file.kind === "video" ? "Video" : "Ảnh")} ·{" "}
            {fileSize(file.size_bytes)}
          </Text>
          <Pressable
            onPress={() => WebBrowser.openBrowserAsync(gatewayUrl(file.url))}
            accessibilityRole="button"
            accessibilityLabel="Tải xuống"
            className={control}
          >
            <Icon name="download" size={20} tone="onDanger" />
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            className={control}
          >
            <Icon name="x" size={20} tone="onDanger" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center">
          {file.kind === "video" ? (
            <ViewerVideo key={file.id} url={file.url} />
          ) : (
            <Picture
              key={file.id}
              src={file.url}
              width={1600}
              fit="contain"
              label={caption}
              className="h-full w-full"
            />
          )}
          {many ? (
            <>
              <Pressable
                onPress={() => move(-1)}
                accessibilityRole="button"
                accessibilityLabel="Tệp trước"
                className={`${control} absolute left-2`}
              >
                <Icon name="chevron-left" size={24} tone="onDanger" />
              </Pressable>
              <Pressable
                onPress={() => move(1)}
                accessibilityRole="button"
                accessibilityLabel="Tệp sau"
                className={`${control} absolute right-2`}
              >
                <Icon name="chevron-right" size={24} tone="onDanger" />
              </Pressable>
            </>
          ) : null}
        </View>
        {caption ? (
          <Text className="max-h-24 p-4 text-center font-body text-sm text-slate-200">
            {caption}
          </Text>
        ) : (
          <View className="h-4" />
        )}
      </Safe>
    </Modal>
  );
}
