import { routes } from './app.routes';

describe('application routes', () => {
  it('defines each public page and a fallback route', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'labs/script-visualizer',
      'about',
      'docs',
      'roadmap',
      'blog',
      'blog/:slug',
      'contact',
      '**',
    ]);
  });

  it('provides a unique document title for every route', () => {
    const titles = routes
      .filter((route) => route.path !== 'blog/:slug')
      .map((route) => route.title);
    expect(titles.every((title) => typeof title === 'string' && title.length > 0)).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
    expect(typeof routes.find((route) => route.path === 'blog/:slug')?.title).toBe('function');
  });
});
