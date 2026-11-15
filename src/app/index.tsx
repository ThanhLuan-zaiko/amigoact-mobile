import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { iconButton, mutedText, pageTitle, screen } from "@/components/ui";
import { useThemeColors } from "@/hooks/useThemeColors";

// Placeholder for the signed-in home, until the feed screen is ported.
export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const theme = useThemeColors();

  return (
    <View className={`${screen} items-center justify-center gap-3 px-6`}>
      <Feather name="heart" size={32} color={theme.accent} />
      <Text className={pageTitle}>Xin chào, {user?.full_name}</Text>
      <Text className={`text-center ${mutedText}`}>
        Ứng dụng di động đang được xây dựng.
      </Text>
      <Pressable
        onPress={signOut}
        accessibilityRole="button"
        accessibilityLabel="Đăng xuất"
        className={iconButton}
      >
        <Feather name="log-out" size={18} color={theme.text} />
      </Pressable>
    </View>
  );
}
