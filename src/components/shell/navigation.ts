import type { IconName } from "../common/Icon";

// Ported from amigoact-fe src/app/_components/navigation.ts.
// True when the pathname is the href itself or a screen inside it. The home
// link only matches "/".
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type NavItem = { label: string; href: string; icon: IconName };

// The web MobileNav, the bar at the bottom of a phone screen.
export const MOBILE_ITEMS: NavItem[] = [
  { label: "Trang chủ", href: "/", icon: "home" },
  { label: "Hoạt động", href: "/activities", icon: "calendar" },
  { label: "Tin nhắn", href: "/messages", icon: "message-square" },
  { label: "Hồ sơ", href: "/account", icon: "user" },
];

// The web SideNav. A phone has no side column, so the account menu shows it.
export const SIDE_ITEMS: NavItem[] = [
  { label: "Trang chủ", href: "/", icon: "home" },
  { label: "Hoạt động", href: "/activities", icon: "calendar" },
  { label: "Giờ tình nguyện", href: "/hours", icon: "clock" },
  { label: "Chứng nhận", href: "/certificates", icon: "award" },
  { label: "Tổ chức của tôi", href: "/organizations", icon: "users" },
  { label: "Tin nhắn", href: "/messages", icon: "message-square" },
  { label: "Hồ sơ", href: "/account", icon: "user" },
];
