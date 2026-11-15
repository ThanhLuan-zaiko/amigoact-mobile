import { useVideoPlayer, VideoView } from "expo-video";
import { withUniwind } from "uniwind";
import { mediaSource } from "@/lib/http";
import { ME } from "@/lib/realtime";
import { invalidate } from "@/lib/refreshBus";
import {
  isWaiting,
  VIDEO_EVENT,
  type VideoInfo,
  videoSources,
} from "@/lib/video";
import { useLiveRefresh } from "../realtime/hooks";

const StyledVideo = withUniwind(VideoView);

// An uploaded video, ported from the web VideoPlayer. Once transcoded it
// streams over HLS, which the native players handle themselves, so a weak
// connection drops to a smaller copy. Before that the upload plays, and the
// screen reloads when the worker reports the copies are ready.
export default function VideoPlayer({
  id,
  info,
  className,
}: {
  id: string;
  info?: VideoInfo | null;
  className: string;
}) {
  const { mp4, hls } = videoSources(id, info);
  const source = mediaSource(hls ?? mp4);
  const player = useVideoPlayer(
    {
      uri: source.uri,
      headers: source.headers,
      contentType: hls ? "hls" : "progressive",
    },
    (created) => {
      created.loop = false;
    },
  );
  useLiveRefresh(isWaiting(info) ? ME : null, [VIDEO_EVENT], invalidate);
  return (
    <StyledVideo
      player={player}
      nativeControls
      contentFit="contain"
      allowsPictureInPicture={false}
      className={className}
    />
  );
}
