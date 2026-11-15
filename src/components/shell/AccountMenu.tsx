import { router, usePathname } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import { getMyOrganizations } from "@/lib/organizationApi";
import { useAuth } from "../AuthProvider";
import { IconButton } from "../common/Button";
import Icon from "../common/Icon";
import Sheet from "../common/Sheet";
import { mutedText } from "../ui";
import { isActivePath, SIDE_ITEMS } from "./navigation";

const sectionHeading =
  "px-3 pb-2 font-body-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400";

// The web AccountMenu (name, "Tài khoản", "Đăng xuất"). A phone has no side
// column, so the menu also carries the web SideNav and the joined
// organizations; see docs/web-parity.md.
export default function AccountMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) {
    return (
      <IconButton
        icon="log-in"
        label="Đăng nhập"
        onPress={() => router.push("/login")}
      />
    );
  }
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Tài khoản của ${user.full_name}`}
        className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 active:border-teal-700 dark:border-slate-700 dark:active:border-teal-400"
      >
        <Icon name="user" />
      </Pressable>
      <Sheet open={open} title={user.full_name} onClose={() => setOpen(false)}>
        <MenuBody
          onGo={(href) => {
            setOpen(false);
            router.navigate(href as never);
          }}
          onSignOut={async () => {
            setOpen(false);
            await signOut();
            router.replace("/");
          }}
        />
      </Sheet>
    </>
  );
}

function MenuBody({
  onGo,
  onSignOut,
}: {
  onGo: (href: string) => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const joined = useLoad(
    async () =>
      (await getMyOrganizations()).filter((org) => org.status === "active"),
    [],
  );
  return (
    <View className="gap-1">
      {SIDE_ITEMS.map(({ label, href, icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <MenuRow
            key={href}
            icon={icon}
            label={label}
            active={active}
            onPress={() => onGo(href)}
          />
        );
      })}
      <Text className={`mt-6 ${sectionHeading}`}>Tổ chức đã tham gia</Text>
      {joined.data === undefined ? null : joined.data.length === 0 ? (
        <Text className={`px-3 pt-1 ${mutedText}`}>
          Chưa tham gia tổ chức nào.
        </Text>
      ) : (
        joined.data.map((org) => (
          <Pressable
            key={org.id}
            onPress={() => onGo(`/org/${encodeURIComponent(org.slug)}`)}
            accessibilityRole="link"
            className="min-h-11 justify-center rounded-md px-3 py-2 active:bg-slate-50 dark:active:bg-slate-900"
          >
            <Text
              numberOfLines={1}
              className="font-body text-sm text-slate-700 dark:text-slate-300"
            >
              {org.name}
            </Text>
          </Pressable>
        ))
      )}
      <View className="mt-4 border-t border-slate-200 pt-2 dark:border-slate-800">
        <MenuRow icon="log-out" label="Đăng xuất" onPress={onSignOut} />
      </View>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      className={`min-h-11 flex-row items-center gap-3 rounded-md border px-3 py-2.5 ${
        active ? "border-teal-700 dark:border-teal-400" : "border-transparent"
      }`}
    >
      <Icon name={icon} tone={active ? "accent" : "text"} />
      <Text
        className={`text-[15px] ${
          active
            ? "font-body-semibold text-teal-700 dark:text-teal-400"
            : "font-body text-slate-700 dark:text-slate-300"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
