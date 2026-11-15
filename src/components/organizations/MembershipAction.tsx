import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import type { FormState } from "@/lib/account";
import { joinOrganization, leaveOrganization } from "@/lib/organizationActions";
import { formatDate, type OrganizationDetail } from "@/lib/organizations";
import { ME } from "@/lib/realtime";
import { invalidate } from "@/lib/refreshBus";
import { useAuth } from "../AuthProvider";
import ActionButton from "../common/ActionButton";
import Button from "../common/Button";
import Icon from "../common/Icon";
import { FormMessage } from "../FormParts";
import { TextAreaField } from "../forms/Fields";
import { useLiveRefresh } from "../realtime/hooks";
import { mutedText, tagChip, tagChipText } from "../ui";

function JoinForm({
  slug,
  needsApproval,
}: {
  slug: string;
  needsApproval: boolean;
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [state, setState] = useState<FormState>({});
  const [pending, setPending] = useState(false);

  async function submit() {
    // Visitors see the join button too, so they log in first and come back.
    if (!user) {
      router.push({ pathname: "/login", params: { next: `/org/${slug}` } });
      return;
    }
    setPending(true);
    setState(await joinOrganization(slug, message));
    setPending(false);
  }

  return (
    <View className="w-full items-start gap-3">
      <FormMessage state={state} />
      {needsApproval ? (
        <View className="w-full">
          <TextAreaField
            label="Lời nhắn cho ban quản trị (không bắt buộc)"
            value={message}
            onChangeText={setMessage}
            rows={3}
            maxLength={1000}
            error={state.fieldErrors?.message}
          />
        </View>
      ) : null}
      <Button
        icon={needsApproval ? "send" : "user-plus"}
        pending={pending}
        onPress={submit}
      >
        {needsApproval ? "Gửi yêu cầu" : "Tham gia"}
      </Button>
    </View>
  );
}

// The viewer's own standing changed, from any device or any manager.
const OWN_EVENTS = ["membership.changed"] as const;

// What the viewer can do with their own membership, ported from the web.
export default function MembershipAction({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  const { slug, viewer, join_policy: joinPolicy } = organization;
  const [formOpen, setFormOpen] = useState(false);
  const watching = viewer.status === "active" || viewer.status === "applied";
  useLiveRefresh(watching ? ME : null, OWN_EVENTS, invalidate, organization.id);

  if (viewer.role === "owner") return null;
  if (viewer.status === "active") {
    return (
      <ActionButton
        action={() => leaveOrganization(slug)}
        icon="log-out"
        label="Rời tổ chức"
        confirmLabel="Rời tổ chức?"
      />
    );
  }
  if (viewer.status === "applied") {
    return (
      <View className="flex-row items-center gap-2">
        <View className={`${tagChip} flex-row items-center gap-1`}>
          <Icon name="clock" size={12} tone="muted" />
          <Text className={tagChipText}>Chờ duyệt</Text>
        </View>
        <ActionButton
          action={() => leaveOrganization(slug)}
          icon="x"
          label="Rút yêu cầu"
        />
      </View>
    );
  }
  if (viewer.status === "suspended") {
    return (
      <Text className={mutedText}>Tư cách thành viên đang bị tạm ngưng.</Text>
    );
  }
  if (viewer.reapply_after) {
    return (
      <Text className={mutedText}>
        Yêu cầu trước đã bị từ chối. Bạn có thể gửi lại từ ngày{" "}
        {formatDate(viewer.reapply_after)}.
      </Text>
    );
  }
  // A removed member always goes through approval, even in an open organization.
  const needsApproval = joinPolicy !== "open" || viewer.status === "revoked";
  if (needsApproval && !formOpen) {
    return (
      <Button variant="secondary" icon="send" onPress={() => setFormOpen(true)}>
        Xin tham gia
      </Button>
    );
  }
  return <JoinForm slug={slug} needsApproval={needsApproval} />;
}
