import { commandRouteItems, navItems, pickSelectedMenuKey, resolveNavigationContext } from './navigationConfig';

describe('Cloud Admin navigation', () => {
  it('contains only Cloud destinations', () => {
    const labels = navItems.map((item) => item.label.toLocaleLowerCase('vi-VN')).join(' ');
    const routes = navItems.map((item) => item.route);

    expect(labels).toContain('hacom cloud');
    expect(routes).toEqual(['/cloud/overview', '/cloud/overview']);
    expect(routes).not.toEqual(expect.arrayContaining(['/users', '/settings/system', '/support-issues']));
  });

  it('does not offer removed authority features through global search', () => {
    const searchTerms = commandRouteItems
      .flatMap((item) => [item.label, item.description, ...item.keywords])
      .join(' ')
      .toLocaleLowerCase('vi-VN');

    expect(searchTerms).not.toMatch(/permission|authority|vai trò|phân quyền/);
  });

  it('maps Cloud routes to Cloud context', () => {
    expect(pickSelectedMenuKey('/cloud/users')).toBe('cloud-users');
    expect(resolveNavigationContext('/cloud/observability').title).toBe('Giám sát Cloud');
  });
});
