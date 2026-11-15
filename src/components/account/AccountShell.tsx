import { router, usePathname } from "expo-router";
import type { ReactNode } from "react";
import type { User } from "@/lib/account";
import Segments from "../common/Segments";
import RequireUser from "../RequireUser";
import Page, { PageTitle } from "../shell/Page";

const ITEMS = [
  { value: "/account", label: "Thông tin", icon: "user" as const },
  { value: "/account/security", label: "Bảo mật", icon: "shield" as const },
  {
    value: "/account/notifications",
    label: "Thông báo",
    icon: "bell" as const,
  },
];

// The web account layout: the title and the section list, then the section.
export default function AccountShell({
  children,
  refreshing,
  onRefresh,
}: {
  children: (user: User) => ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const pathname = usePathname();
  return (
    <RequireUser>
      {(user) => (
        <Page refreshing={refreshing} onRefresh={onRefresh}>
          <PageTitle>Tài khoản</PageTitle>
          <Segments
            items={ITEMS}
            current={pathname}
            label="Tài khoản"
            compact
            onChange={(href) => {
              if (href !== pathname) router.replace(href as never);
            }}
          />
          {children(user)}
        </Page>
      )}
    </RequireUser>
  );
}
