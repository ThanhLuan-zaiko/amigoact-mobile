import { router, useLocalSearchParams, usePathname } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";
import { useLoad } from "@/hooks/useLoad";
import { param } from "@/lib/appPath";
import { getOrganization } from "@/lib/organizationApi";
import type { OrganizationDetail } from "@/lib/organizations";
import { feedBackHref } from "@/lib/orgBack";
import { invalidate } from "@/lib/refreshBus";
import Button from "../common/Button";
import EmptyState, { LoadError, Loading } from "../common/States";
import Page from "../shell/Page";
import OrgHeader, { ShortOrgHeader } from "./OrgHeader";

export function useSlug(): string {
  return param(useLocalSearchParams<{ slug?: string }>().slug);
}

// The web org/[slug] layout, for every screen of an organization: it loads the
// organization, shows the header (or the short header on feed sub-screens),
// and hands the organization to the screen. A missing organization shows the
// web not-found message.
export default function OrgScreen({
  children,
  scroll = true,
}: {
  children: (organization: OrganizationDetail, slug: string) => ReactNode;
  scroll?: boolean;
}) {
  const slug = useSlug();
  const pathname = usePathname();
  const org = useLoad(async () => {
    try {
      return { found: await getOrganization(slug) };
    } catch {
      return { found: undefined };
    }
  }, [slug]);
  const short = feedBackHref(pathname, slug) !== null;

  let body: ReactNode;
  if (org.loading) {
    body = <Loading />;
  } else if (org.data?.found === undefined) {
    body = <LoadError>Không tải được tổ chức. Vui lòng thử lại.</LoadError>;
  } else if (org.data.found === null) {
    body = (
      <View className="items-start gap-4">
        <View className="w-full">
          <EmptyState
            title="Không tìm thấy tổ chức"
            description="Tổ chức này không tồn tại hoặc không còn hoạt động."
          />
        </View>
        <Button
          variant="secondary"
          onPress={() => router.navigate("/organizations")}
        >
          Xem các tổ chức khác
        </Button>
      </View>
    );
  } else {
    const found = org.data.found;
    body = (
      <>
        {short ? null : <OrgHeader organization={found} />}
        {children(found, slug)}
      </>
    );
  }
  // The short row stays in view while a post scrolls, as the web row sticks.
  const top =
    short && org.data?.found ? (
      <ShortOrgHeader organization={org.data.found} />
    ) : undefined;

  return (
    <Page
      top={top}
      scroll={scroll}
      refreshing={org.refreshing}
      onRefresh={() => {
        invalidate();
        org.reload(true);
      }}
    >
      {body}
    </Page>
  );
}
