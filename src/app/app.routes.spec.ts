import { routes } from './app.routes';

describe('application routes', () => {
  it('defines public pages, object display routes, legacy redirects, and a fallback route', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'visualizer',
      'explorer',
      'display/block/:hash',
      'display/transaction/:txid/input/:index',
      'display/transaction/:txid/output/:index',
      'display/transaction/:txid',
      'display',
      'about',
      'labs/script-visualizer',
      'labs/transaction-explorer',
      'contact',
      '**',
    ]);
  });

  it('provides a unique document title for every rendered route', () => {
    const renderedRoutes = routes.filter((route) => !route.redirectTo);
    const titles = renderedRoutes.map((route) => route.title);
    expect(titles.every((title) => typeof title === 'string' && title.length > 0)).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
    expect(routes.find((route) => route.path === 'labs/script-visualizer')?.redirectTo).toBe(
      'visualizer',
    );
  });
});
