import type { Role } from '@/api/types/auth/auth';
import type { AppIconKey } from '@/components/AppIcon/AppIcon';

export interface NavItem {
  key: string;
  label: string;
  iconKey: AppIconKey;
  section: SidebarSectionKey;
  route: string;
  roles?: Role[];
  children?: NavItem[];
}

export type SidebarSectionKey = 'overview' | 'cloud';

export interface SidebarSection {
  key: SidebarSectionKey;
  label: string;
  iconKey?: AppIconKey;
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { key: 'overview', label: 'Tổng quan', iconKey: 'dashboard' },
  { key: 'cloud', label: 'Hacom Cloud', iconKey: 'fileStack' },
];

const cloudItems: NavItem[] = [
  { key: 'cloud-overview', label: 'Tổng quan Cloud', iconKey: 'dashboard', section: 'cloud', route: '/cloud/overview' },
  { key: 'cloud-observability', label: 'Giám sát Cloud', iconKey: 'monitor', section: 'cloud', route: '/cloud/observability' },
  { key: 'cloud-quota-requests', label: 'Duyệt quota Cloud', iconKey: 'sliders', section: 'cloud', route: '/cloud/quota-requests' },
  { key: 'cloud-users', label: 'Người dùng Cloud', iconKey: 'users', section: 'cloud', route: '/cloud/users' },
  { key: 'cloud-drives', label: 'Drive Cloud', iconKey: 'fileStack', section: 'cloud', route: '/cloud/drives' },
  { key: 'cloud-items', label: 'Item Cloud', iconKey: 'list', section: 'cloud', route: '/cloud/items' },
  { key: 'cloud-trash', label: 'Thùng rác Cloud', iconKey: 'archive', section: 'cloud', route: '/cloud/trash' },
  { key: 'cloud-jobs', label: 'Tác vụ nền Cloud', iconKey: 'activity', section: 'cloud', route: '/cloud/jobs' },
  { key: 'cloud-audit', label: 'Nhật ký Cloud', iconKey: 'history', section: 'cloud', route: '/cloud/audit' },
];

export const navItems: NavItem[] = [
  { key: 'operations-overview', label: 'Trung tâm vận hành', iconKey: 'dashboard', section: 'overview', route: '/cloud/overview' },
  { key: 'cloud', label: 'Hacom Cloud', iconKey: 'fileStack', section: 'cloud', route: '/cloud/overview', children: cloudItems },
];

export const breadcrumbNameMap: Record<string, string> = {
  '/': 'Tổng quan Cloud',
  '/cloud': 'Tổng quan Cloud',
  '/cloud/overview': 'Tổng quan Cloud',
  '/cloud/observability': 'Giám sát Cloud',
  '/cloud/quota-requests': 'Duyệt quota Cloud',
  '/cloud/users': 'Người dùng Cloud',
  '/cloud/drives': 'Drive Cloud',
  '/cloud/items': 'Item Cloud',
  '/cloud/trash': 'Thùng rác Cloud',
  '/cloud/jobs': 'Tác vụ nền Cloud',
  '/cloud/audit': 'Nhật ký Cloud',
  '/profile': 'Hồ sơ cá nhân',
};

const flattenNavItems = (items: NavItem[]): NavItem[] =>
  items.flatMap((item) => [item, ...(item.children ? flattenNavItems(item.children) : [])]);

export const resolveNavigationContext = (pathname: string) => {
  if (pathname.startsWith('/profile')) {
    return {
      item: null,
      section: null,
      title: 'Hồ sơ cá nhân',
      sectionLabel: 'Tài khoản',
      breadcrumbs: [
        { route: '/cloud/overview', label: 'Tổng quan Cloud' },
        { route: '/profile', label: 'Hồ sơ cá nhân' },
      ],
    };
  }

  const item =
    flattenNavItems(navItems)
      .sort((left, right) => right.route.length - left.route.length)
      .find((entry) => pathname === entry.route || pathname.startsWith(`${entry.route}/`)) ?? null;
  const section = item ? SIDEBAR_SECTIONS.find((entry) => entry.key === item.section) ?? null : null;

  return {
    item,
    section,
    title: item?.label ?? 'Tổng quan Cloud',
    sectionLabel: section?.label ?? 'Tổng quan',
    breadcrumbs: item ? [{ route: item.route, label: item.label }] : [],
  };
};

export const pickSelectedMenuKey = (pathname: string): string => {
  if (pathname.startsWith('/cloud/observability')) return 'cloud-observability';
  if (pathname.startsWith('/cloud/quota-requests')) return 'cloud-quota-requests';
  if (pathname.startsWith('/cloud/users')) return 'cloud-users';
  if (pathname.startsWith('/cloud/drives')) return 'cloud-drives';
  if (pathname.startsWith('/cloud/items')) return 'cloud-items';
  if (pathname.startsWith('/cloud/trash')) return 'cloud-trash';
  if (pathname.startsWith('/cloud/jobs')) return 'cloud-jobs';
  if (pathname.startsWith('/cloud/audit')) return 'cloud-audit';
  return 'cloud-overview';
};

export type CommandCategory =
  | 'Điều hướng'
  | 'Hệ thống'
  | 'Người dùng'
  | 'Hỗ trợ tài khoản'
  | 'Thao tác nhanh'
  | 'Vận hành'
  | 'Realtime'
  | 'Cài đặt'
  | 'Cloud';

export interface CommandRouteItem {
  id: string;
  label: string;
  description: string;
  category: CommandCategory;
  iconKey: AppIconKey;
  keywords: string[];
  route?: string;
  disabled?: boolean;
  roles?: Role[];
}

export const commandRouteItems: CommandRouteItem[] = flattenNavItems(navItems).map((item) => ({
  id: `go-${item.key}`,
  label: item.label,
  description: `Mở ${item.label.toLocaleLowerCase('vi-VN')}.`,
  category: item.section === 'cloud' ? 'Cloud' : 'Điều hướng',
  iconKey: item.iconKey,
  keywords: [item.key, item.label.toLocaleLowerCase('vi-VN')],
  route: item.route,
  roles: item.roles,
}));
