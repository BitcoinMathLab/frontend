import { metadataForPath } from './route-metadata';

describe('route metadata catalog', () => {
  it('describes the five public routes', () => {
    expect(metadataForPath('/').title).toBe('Bitcoin Math Lab — See Bitcoin execute');
    expect(metadataForPath('/visualizer').description).toContain('P2PKH');
    expect(metadataForPath('/explorer').description).toContain('previous outputs');
    expect(metadataForPath('/about').title).toBe('About — Bitcoin Math Lab');
    expect(metadataForPath('/contact').title).toBe('Contact — Bitcoin Math Lab');
  });

  it('does not substitute metadata for removed or unknown paths', () => {
    expect(metadataForPath('/blog/not-published').title).toBe('Page not found — Bitcoin Math Lab');
    expect(metadataForPath('/roadmap').title).toBe('Page not found — Bitcoin Math Lab');
    expect(metadataForPath('/docs').title).toBe('Page not found — Bitcoin Math Lab');
    expect(metadataForPath('/not-a-route').description).toContain('could not be found');
  });
});
