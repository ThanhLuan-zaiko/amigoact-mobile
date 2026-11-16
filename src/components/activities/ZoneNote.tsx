import { Text, View } from "react-native";
import { describeZone } from "@/lib/timeZone";
import Icon from "../common/Icon";
import { mutedText } from "../ui";

// The same note as the web form: the picked times are read in this zone. On a
// phone that is the device zone, which activityActions also uses.
export default function ZoneNote() {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name="globe" tone="subtle" />
      <Text className={`${mutedText} flex-1`}>
        Giờ theo múi giờ {describeZone()}
      </Text>
    </View>
  );
}
