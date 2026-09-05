import { metadataForPath } from './route-metadata';

describe('route metadata catalog', () => {
  it('describes the public routes', () => {
    expect(metadataForPath('/').title).toBe('Bitcoin Math Lab — See Bitcoin execute');
    expect(metadataForPath('/visualizer').description).toContain('empty stacks');
    expect(metadataForPath('/visualizer').description).not.toContain('valid and invalid');
    expect(metadataForPath('/explorer').description).toContain('decoded byte ranges');
    expect(metadataForPath('/display').description).toContain('serialized bytes');
    expect(metadataForPath('/display/transaction/abc').title).toBe(
      'Bitcoin Object Display — Bitcoin Math Lab',
    );
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
