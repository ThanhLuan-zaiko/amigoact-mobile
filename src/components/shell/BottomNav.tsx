import { router, usePathname } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import Icon from "../common/Icon";
import { isActivePath, MOBILE_ITEMS } from "./navigation";

const Safe = withUniwind(SafeAreaView);

// The web MobileNav: five icons at the bottom, the current one outlined teal.
export default function BottomNav() {
  const pathname = usePathname();
  return (
    <Safe
      edges={["bottom"]}
      className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
    >
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Điều hướng nhanh"
        className="h-14 flex-row items-center justify-around"
      >
        {MOBILE_ITEMS.map(({ label, href, icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Pressable
              key={href}
              onPress={() => {
                if (!active) router.navigate(href);
              }}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              className={`h-11 w-12 items-center justify-center rounded-md border ${
                active
                  ? "border-teal-700 dark:border-teal-400"
                  : "border-transparent"
              }`}
            >
              <Icon name={icon} size={20} tone={active ? "accent" : "subtle"} />
            </Pressable>
          );
        })}
      </View>
    </Safe>
  );
}
