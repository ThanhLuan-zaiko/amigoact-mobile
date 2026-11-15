import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { Text, View } from "react-native";
import { withUniwind } from "uniwind";
import { tokenFromScan } from "@/lib/checkInLink";
import Button from "../common/Button";
import { mutedText } from "../ui";

const StyledCamera = withUniwind(CameraView);

// Scans the attendance QR with the camera, the one thing the web cannot do
// itself (it relies on the phone's camera app). Only a check-in address is
// accepted; anything else is ignored. See docs/web-parity.md.
export default function QrScanner({
  onToken,
  onWrongCode,
}: {
  onToken: (token: string) => void;
  onWrongCode: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  // The camera reports the same code many times a second; one is enough.
  const handled = useRef(false);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View className="items-start gap-3">
        <Text className={mutedText}>
          Cho phép dùng camera để quét mã QR điểm danh, hoặc nhập mã bên dưới.
        </Text>
        <Button variant="secondary" icon="camera" onPress={requestPermission}>
          Cho phép camera
        </Button>
      </View>
    );
  }
  return (
    <View className="aspect-square w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
      <StyledCamera
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => {
          if (handled.current) return;
          const token = tokenFromScan(data);
          handled.current = true;
          if (token) onToken(token);
          else {
            onWrongCode();
            // Let the viewer aim at the right code again.
            setTimeout(() => {
              handled.current = false;
            }, 2000);
          }
        }}
        className="h-full w-full"
      />
    </View>
  );
}
