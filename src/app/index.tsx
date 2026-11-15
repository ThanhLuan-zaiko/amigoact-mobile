import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function HomeScreen() {
  const theme = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-white px-6 dark:bg-slate-950">
      <Feather name="heart" size={32} color={theme.accent} />
      <Text className="font-semibold text-2xl text-slate-900 dark:text-slate-100">
        AmigoACT
      </Text>
      <Text className="text-center text-slate-600 dark:text-slate-400">
        Ứng dụng di động đang được xây dựng.
      </Text>
    </View>
  );
}
