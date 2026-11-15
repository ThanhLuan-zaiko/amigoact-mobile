import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import { getMyOrganizations } from "@/lib/organizationApi";
import { postableOrganizations } from "@/lib/posts";
import { useAuth } from "../AuthProvider";
import Icon from "../common/Icon";
import Sheet from "../common/Sheet";
import { primaryButton } from "../ui";

// The web ComposeMenu. Posts live inside an organization. With one place to
// post, the button opens its form. With several, it lists them. With none, it
// leads to the organization list. A visitor goes to the login screen.
export default function ComposeMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const choices = useLoad(
    async () =>
      user
        ? postableOrganizations(await getMyOrganizations(), "discussion")
        : [],
    [user?.id],
  );
  const list = choices.data ?? [];

  function press() {
    if (!user) {
      router.push({ pathname: "/login", params: { next: "/compose" } });
      return;
    }
    if (list.length > 1) {
      setOpen(true);
      return;
    }
    router.push(
      (list[0] ? `/org/${list[0].slug}/posts/new` : "/organizations") as never,
    );
  }

  return (
    <>
      <Pressable
        onPress={press}
        accessibilityRole="button"
        accessibilityLabel="Tạo bài"
        className={`${primaryButton} w-11 px-0`}
      >
        <Icon name="plus" tone="onAccent" />
      </Pressable>
      <Sheet open={open} title="Đăng bài trong" onClose={() => setOpen(false)}>
        <View className="gap-1">
          {list.map((org) => (
            <Pressable
              key={org.id}
              onPress={() => {
                setOpen(false);
                router.push(`/org/${org.slug}/posts/new` as never);
              }}
              accessibilityRole="link"
              className="min-h-11 justify-center rounded-md px-3 py-2 active:bg-teal-50 dark:active:bg-teal-950/40"
            >
              <Text
                numberOfLines={1}
                className="font-body-semibold text-sm text-slate-700 dark:text-slate-300"
              >
                {org.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </>
  );
}
