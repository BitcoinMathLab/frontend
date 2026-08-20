import { CURATED_P2PKH_REQUEST } from './curated-p2pkh';
import { P2pkhTraceRequest } from './trace-api.models';

export type VisualizerLessonId = 'p2pk-context' | 'p2pkh-valid' | 'p2pkh-invalid';

export interface VisualizerLesson {
  readonly id: VisualizerLessonId;
  readonly order: string;
  readonly title: string;
  readonly scriptType: 'P2PK' | 'P2PKH';
  readonly kind: 'concept' | 'live';
  readonly expectedOutcome: 'Context' | 'Valid' | 'Invalid';
  readonly summary: string;
  readonly objectives: readonly string[];
  readonly scriptPattern: string;
  readonly request: P2pkhTraceRequest | null;
}

const invalidTransaction = CURATED_P2PKH_REQUEST.transaction_hex.replace('c233', 'c333');

export const VISUALIZER_LESSONS: readonly VisualizerLesson[] = Object.freeze([
  {
    id: 'p2pk-context',
    order: '01',
    title: 'Before address hashes',
    scriptType: 'P2PK',
    kind: 'concept',
    expectedOutcome: 'Context',
    summary:
      'Early Bitcoin outputs placed a public key directly in the locking script. P2PKH adds an identity check before the same signature check.',
    objectives: [
      'Recognize the public-key push followed by OP_CHECKSIG.',
      'Understand why P2PKH hashes the public key in the locking script.',
      'Identify OP_CHECKSIG as the shared final verification step.',
    ],
    scriptPattern: '<public key> OP_CHECKSIG',
    request: null,
  },
  {
    id: 'p2pkh-valid',
    order: '02',
    title: 'A valid P2PKH spend',
    scriptType: 'P2PKH',
    kind: 'live',
    expectedOutcome: 'Valid',
    summary:
      'Follow a historical transaction as it proves that the supplied public key matches the committed hash and the signature authorizes the spend.',
    objectives: [
      'Watch the signature and public key enter the stack.',
      'See OP_DUP and OP_HASH160 derive the public-key identity.',
      'Connect OP_EQUALVERIFY and OP_CHECKSIG to the valid result.',
    ],
    scriptPattern: 'OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG',
    request: CURATED_P2PKH_REQUEST,
  },
  {
    id: 'p2pkh-invalid',
    order: '03',
    title: 'One changed signature byte',
    scriptType: 'P2PKH',
    kind: 'live',
    expectedOutcome: 'Invalid',
    summary:
      'Replay the same spend after changing one byte inside its signature. The public-key hash still matches, but authorization fails at OP_CHECKSIG.',
    objectives: [
      'Compare the unchanged identity check with the failed signature check.',
      'Locate the false final value in the trace.',
      'Understand why a cryptographic failure is a normal script result.',
    ],
    scriptPattern: 'Valid structure + altered signature → false',
    request: {
      ...CURATED_P2PKH_REQUEST,
      transaction_hex: invalidTransaction,
    },
  },
]);
