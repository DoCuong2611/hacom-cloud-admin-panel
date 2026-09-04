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

export type SidebarSectionKey = 'overview' | 'system' | 'users' | 'account-support' | 'local' | 'cloud';

export interface SidebarSection {
  key: SidebarSectionKey;
  label: string;
  iconKey?: AppIconKey;
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { key: 'overview', label: 'Tổng quan', iconKey: 'dashboard' },
  { key: 'system', label: 'Hệ thống', iconKey: 'server' },
  { key: 'users', label: 'Người dùng', iconKey: 'users' },
  { key: 'cloud', label: 'Hacom Cloud', iconKey: 'fileStack' },
  { key: 'account-support', label: 'Hỗ trợ tài khoản', iconKey: 'access' },
  { key: 'local', label: 'Cục bộ', iconKey: 'settings' },
];

export const navItems: NavItem[] = [
  {
    key: 'operations-overview',
    label: 'Trung tâm vận hành',
    iconKey: 'dashboard',
    section: 'overview',
    route: '/',
  },
  {
    key: 'service-health',
    label: 'Sức khỏe dịch vụ',
    iconKey: 'server',
    section: 'system',
    route: '/services/health',
  },
  {
    key: 'realtime',
    label: 'Realtime & kết nối',
    iconKey: 'activity',
    section: 'system',
    route: '/realtime/dashboard',
  },
  {
    key: 'traffic',
    label: 'Traffic & hiệu năng',
    iconKey: 'trending',
    section: 'system',
    route: '/realtime/traffic',
  },
  {
    key: 'bottlenecks',
    label: 'Điểm nghẽn',
    iconKey: 'alert',
    section: 'system',
    route: '/monitoring',
  },
  {
    key: 'logs',
    label: 'Logs & sự cố',
    iconKey: 'fileText',
    section: 'system',
    route: '/logs',
  },
  {
    key: 'cloud',
    label: 'Hacom Cloud',
    iconKey: 'fileStack',
    section: 'cloud',
    route: '/cloud/overview',
    children: [
      {
        key: 'cloud-overview',
        label: 'Tổng quan Cloud',
        iconKey: 'dashboard',
        section: 'cloud',
        route: '/cloud/overview',
      },
      {
        key: 'cloud-observability',
        label: 'Giám sát Cloud',
        iconKey: 'monitor',
        section: 'cloud',
        route: '/cloud/observability',
      },
      {
        key: 'cloud-quota-requests',
        label: 'Duyệt quota Cloud',
        iconKey: 'sliders',
        section: 'cloud',
        route: '/cloud/quota-requests',
      },
      {
        key: 'cloud-users',
        label: 'Người dùng Cloud',
        iconKey: 'users',
        section: 'cloud',
        route: '/cloud/users',
      },
      {
        key: 'cloud-drives',
        label: 'Drive Cloud',
        iconKey: 'fileStack',
        section: 'cloud',
        route: '/cloud/drives',
      },
      {
        key: 'cloud-items',
        label: 'Item Cloud',
        iconKey: 'list',
        section: 'cloud',
        route: '/cloud/items',
      },
      {
        key: 'cloud-trash',
        label: 'Thùng rác Cloud',
        iconKey: 'archive',
        section: 'cloud',
        route: '/cloud/trash',
      },
      {
        key: 'cloud-jobs',
        label: 'Tác vụ nền Cloud',
        iconKey: 'activity',
        section: 'cloud',
        route: '/cloud/jobs',
      },
      {
        key: 'cloud-audit',
        label: 'Nhật ký Cloud',
        iconKey: 'history',
        section: 'cloud',
        route: '/cloud/audit',
      },
    ],
  },

  {
    key: 'user-operations',
    label: 'Hiện trạng người dùng',
    iconKey: 'users',
    section: 'users',
    route: '/users',
  },
  {
    key: 'work-reports',
    label: 'Báo cáo công việc',
    iconKey: 'inbox',
    section: 'users',
    route: '/support-issues',
  },
  {
    key: 'user-activity',
    label: 'Hoạt động người dùng',
    iconKey: 'activity',
    section: 'users',
    route: '/users/activity',
  },
  {
    key: 'account-lookup',
    label: 'Tra cứu tài khoản',
    iconKey: 'search',
    section: 'account-support',
    route: '/users',
  },
  {
    key: 'support-history',
    label: 'Lịch sử thao tác',
    iconKey: 'history',
    section: 'account-support',
    route: '/audit',
  },
  {
    key: 'display-settings',
    label: 'Thiết lập hiển thị',
    iconKey: 'settings',
    section: 'local',
    route: '/settings/system',
  },
];

export const breadcrumbNameMap: Record<string, string> = {
  '/': 'Trung tâm vận hành',
  '/services/health': 'Sức khỏe dịch vụ',
  '/realtime': 'Realtime & kết nối',
  '/realtime/dashboard': 'Realtime & kết nối',
  '/realtime/online-users': 'Người dùng online',
  '/realtime/traffic': 'Traffic & hiệu năng',
  '/monitoring': 'Điểm nghẽn',
  '/logs': 'Logs & sự cố',
  '/users': 'Hiện trạng người dùng',
  '/users/activity': 'Hoạt động người dùng',
  '/support-issues': 'Báo cáo công việc',
  '/audit': 'Lịch sử thao tác',
  '/settings/system': 'Thiết lập hiển thị',
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
        { route: '/', label: 'Trung tâm vận hành' },
        { route: '/profile', label: 'Hồ sơ cá nhân' },
      ],
    };
  }

  const item =
    flattenNavItems(navItems)
      .sort((left, right) => right.route.length - left.route.length)
      .find((entry) =>
        entry.route === '/'
          ? pathname === '/'
          : pathname === entry.route || pathname.startsWith(`${entry.route}/`),
      ) ?? null;
  const section = item ? SIDEBAR_SECTIONS.find((entry) => entry.key === item.section) ?? null : null;

  return {
    item,
    section,
    title: item?.label ?? 'Trung tâm vận hành',
    sectionLabel: section?.label ?? 'Tổng quan',
    breadcrumbs: item ? [{ route: item.route, label: item.label }] : [],
  };
};

export const pickSelectedMenuKey = (pathname: string): string => {
  if (pathname === '/') return 'operations-overview';
  if (pathname.startsWith('/cloud/observability')) return 'cloud-observability';
  if (pathname.startsWith('/cloud/quota-requests')) return 'cloud-quota-requests';
  if (pathname.startsWith('/cloud/users')) return 'cloud-users';
  if (pathname.startsWith('/cloud/drives')) return 'cloud-drives';
  if (pathname.startsWith('/cloud/items')) return 'cloud-items';
  if (pathname.startsWith('/cloud/trash')) return 'cloud-trash';
  if (pathname.startsWith('/cloud/jobs')) return 'cloud-jobs';
  if (pathname.startsWith('/cloud/audit')) return 'cloud-audit';
  if (pathname.startsWith('/cloud')) return 'cloud-overview';
  if (pathname.startsWith('/services')) return 'service-health';
  if (pathname.startsWith('/realtime/traffic')) return 'traffic';
  if (pathname.startsWith('/realtime')) return 'realtime';
  if (pathname.startsWith('/monitoring') || pathname.startsWith('/alerts')) return 'bottlenecks';
  if (pathname.startsWith('/logs')) return 'logs';
  if (pathname.startsWith('/support-issues')) return 'work-reports';
  if (pathname.startsWith('/audit')) return 'support-history';
  if (pathname.startsWith('/settings')) return 'display-settings';
  if (pathname.startsWith('/users/activity')) return 'user-activity';
  if (pathname.startsWith('/users')) return 'user-operations';
  return 'operations-overview';
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

export const commandRouteItems: CommandRouteItem[] = navItems.map((item) => ({
  id: `go-${item.key}`,
  label: item.label,
  description: `Mở ${item.label.toLocaleLowerCase('vi-VN')}.`,
  category:
    item.section === 'system'
      ? 'Hệ thống'
      : item.section === 'users'
        ? 'Người dùng'
        : item.section === 'account-support'
          ? 'Hỗ trợ tài khoản'
          : item.section === 'cloud'
            ? 'Cloud'
            : 'Điều hướng',
  iconKey: item.iconKey,
  keywords: [item.key, item.label.toLocaleLowerCase('vi-VN')],
  route: item.route,
  roles: item.roles,
}));
