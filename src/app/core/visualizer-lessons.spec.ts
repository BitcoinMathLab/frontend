import { CURATED_P2PKH_REQUEST } from './curated-p2pkh';
import { VISUALIZER_LESSONS } from './visualizer-lessons';

describe('visualizer lessons', () => {
  it('defines P2PK context and live valid and invalid P2PKH examples', () => {
    expect(VISUALIZER_LESSONS.map((lesson) => lesson.id)).toEqual([
      'p2pk-context',
      'p2pkh-valid',
      'p2pkh-invalid',
    ]);
    expect(VISUALIZER_LESSONS[0].request).toBeNull();
    expect(VISUALIZER_LESSONS.slice(1).every((lesson) => lesson.request !== null)).toBe(true);
  });

  it('changes one signature byte without changing the lesson transaction shape', () => {
    const invalidRequest = VISUALIZER_LESSONS[2].request;

    expect(invalidRequest?.transaction_hex).not.toBe(CURATED_P2PKH_REQUEST.transaction_hex);
    expect(invalidRequest?.transaction_hex.length).toBe(
      CURATED_P2PKH_REQUEST.transaction_hex.length,
    );
    expect(invalidRequest?.spent_outputs).toEqual(CURATED_P2PKH_REQUEST.spent_outputs);
  });
});
