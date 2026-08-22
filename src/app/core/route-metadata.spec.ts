import { metadataForPath } from './route-metadata';

describe('route metadata catalog', () => {
  it('describes primary product and documentation routes', () => {
    expect(metadataForPath('/').title).toBe('Bitcoin Math Lab — See Bitcoin execute');
    expect(metadataForPath('/labs/script-visualizer').description).toContain('P2PKH');
    expect(metadataForPath('/labs/transaction-explorer').description).toContain('previous outputs');
    expect(metadataForPath('/docs').description).toContain('architecture');
  });

  it('publishes article metadata for known slugs', () => {
    const metadata = metadataForPath('/blog/inside-script-visualizer');

    expect(metadata.type).toBe('article');
    expect(metadata.title).toBe('Inside the Script Visualizer — Bitcoin Math Lab');
  });

  it('does not substitute metadata for unknown paths or articles', () => {
    expect(metadataForPath('/blog/not-published').title).toBe('Page not found — Bitcoin Math Lab');
    expect(metadataForPath('/not-a-route').description).toContain('could not be found');
  });
});
