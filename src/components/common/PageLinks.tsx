import { Pressable, Text, View } from "react-native";
import { lastPage, PAGE_SIZE, pageNumbers } from "@/lib/pagination";
import { IconButton } from "./Button";

// Numbered pages, the native counterpart of the web PageLinks. The screen
// keeps the page in its route params, as the web keeps ?page=N.
export default function PageLinks({
  offset,
  total,
  onPage,
}: {
  offset: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const last = lastPage(total);
  if (page === 1 && last === 1) return null;
  return (
    <View
      accessibilityLabel="Phân trang"
      className="flex-row flex-wrap items-center gap-2"
    >
      {page > 1 ? (
        <IconButton
          icon="chevron-left"
          label="Trang trước"
          onPress={() => onPage(Math.min(page - 1, last))}
        />
      ) : null}
      {pageNumbers(page, last).map((item, index) =>
        item === "gap" ? (
          <Text
            // biome-ignore lint/suspicious/noArrayIndexKey: at most two gaps, never reordered.
            key={`gap-${index}`}
            className="px-1 font-body text-slate-500"
          >
            …
          </Text>
        ) : item === page ? (
          <View
            key={item}
            accessibilityState={{ selected: true }}
            className="h-11 min-w-11 items-center justify-center rounded-md border border-teal-700 bg-teal-50 px-2 dark:border-teal-400 dark:bg-teal-950/40"
          >
            <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
              {item}
            </Text>
          </View>
        ) : (
          <Pressable
            key={item}
            onPress={() => onPage(item)}
            accessibilityRole="button"
            accessibilityLabel={`Trang ${item}`}
            className="h-11 min-w-11 items-center justify-center rounded-md border border-slate-200 px-2 active:border-teal-700 dark:border-slate-800 dark:active:border-teal-400"
          >
            <Text className="font-body text-sm text-slate-700 dark:text-slate-300">
              {item}
            </Text>
          </Pressable>
        ),
      )}
      {page < last ? (
        <IconButton
          icon="chevron-right"
          label="Trang sau"
          onPress={() => onPage(page + 1)}
        />
      ) : null}
    </View>
  );
}

// Cursor paging: "Xem bài cũ hơn" under a feed.
export function MoreButton({
  visible,
  onPress,
  children = "Xem bài cũ hơn",
}: {
  visible: boolean;
  onPress: () => void;
  children?: string;
}) {
  if (!visible) return null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="min-h-11 items-center justify-center self-center px-3"
    >
      <Text className="font-body-semibold text-sm text-teal-700 dark:text-teal-400">
        {children}
      </Text>
    </Pressable>
  );
}
