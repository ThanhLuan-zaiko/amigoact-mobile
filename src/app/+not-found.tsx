import { router } from "expo-router";
import { View } from "react-native";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/States";
import Page from "@/components/shell/Page";

// A link to a screen the app does not have.
export default function NotFoundScreen() {
  return (
    <Page>
      <View className="items-start gap-4">
        <View className="w-full">
          <EmptyState
            title="Không tìm thấy trang"
            description="Trang này không tồn tại hoặc đã được chuyển đi."
          />
        </View>
        <Button
          variant="secondary"
          icon="home"
          onPress={() => router.replace("/")}
        >
          Về trang chủ
        </Button>
      </View>
    </Page>
  );
}
