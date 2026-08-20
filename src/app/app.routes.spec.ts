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
      'contact',
      '**',
    ]);
  });

  it('provides a unique document title for every route', () => {
    const titles = routes.map((route) => route.title);
    expect(titles.every((title) => typeof title === 'string' && title.length > 0)).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
