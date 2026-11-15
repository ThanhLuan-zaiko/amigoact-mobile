import { router } from "expo-router";
import { appPath } from "@/lib/appPath";
import { IconButton } from "../common/Button";

// The one back arrow of the app, the native counterpart of the web BackLink.
// It returns to the screen the viewer came from; with no earlier screen (a
// screen opened from a link), it goes to its fallback address.
export default function BackLink({ href }: { href: string }) {
  return (
    <IconButton
      icon="arrow-left"
      label="Quay lại"
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace(appPath(href) as never);
      }}
    />
  );
}
