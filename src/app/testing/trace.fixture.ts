import { ExecutionTrace, P2pkhTraceResponse, P2wpkhTraceResponse } from '../core/trace-api.models';

export const TRACE_FIXTURE: ExecutionTrace = {
  schema_version: 1,
  script: '515293',
  success: true,
  diagnostic: null,
  steps: [
    {
      index: 0,
      opcode: {
        name: 'OP_1',
        value: 81,
        hex: '0x51',
        byte_offset: 0,
        byte_length: 1,
        raw: '51',
        is_push: false,
        push_data: null,
      },
      stacks: {
        before: { main: { depth: 0, items: [] }, alt: { depth: 0, items: [] } },
        after: { main: { depth: 1, items: ['01'] }, alt: { depth: 0, items: [] } },
      },
      explanation: 'Push the Script number 1 onto the main stack.',
      diagnostic: null,
    },
    {
      index: 1,
      opcode: {
        name: 'OP_2',
        value: 82,
        hex: '0x52',
        byte_offset: 1,
        byte_length: 1,
        raw: '52',
        is_push: false,
        push_data: null,
      },
      stacks: {
        before: { main: { depth: 1, items: ['01'] }, alt: { depth: 0, items: [] } },
        after: { main: { depth: 2, items: ['02', '01'] }, alt: { depth: 0, items: [] } },
      },
      explanation: 'Push the Script number 2 onto the main stack.',
      diagnostic: null,
    },
    {
      index: 2,
      opcode: {
        name: 'OP_ADD',
        value: 147,
        hex: '0x93',
        byte_offset: 2,
        byte_length: 1,
        raw: '93',
        is_push: false,
        push_data: null,
      },
      stacks: {
        before: { main: { depth: 2, items: ['02', '01'] }, alt: { depth: 0, items: [] } },
        after: { main: { depth: 1, items: ['03'] }, alt: { depth: 0, items: [] } },
      },
      explanation: 'Add the top two Script numbers and push the result.',
      diagnostic: null,
    },
  ],
};

export const TRACE_RESPONSE_FIXTURE: P2pkhTraceResponse = {
  api_version: 'v1',
  script_type: 'P2PKH',
  input_index: 0,
  scripts: {
    unlocking: '5152',
    locking: '93',
    combined: '515293',
  },
  sources: {
    script_sig: {
      transaction_txid: '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930',
      index: 0,
    },
    script_pubkey: {
      transaction_txid: '0b6461de422c46a221db99608fcbe0326e4f2325ebf2a47c9faf660ed61ee6a4',
      index: 1,
    },
  },
  signature: {
    algorithm: 'ECDSA/secp256k1',
    signature_hex: '3045022100c233c3a8a510e03ad18b0a24694ef00c78101bfd5ac075b8c1037952ce26e91e',
    public_key_hex: '03f0609c81a45f8cab67fc2d050c21b1acd3d37c7acfd54041be6601ab4cef4f31',
    sighash_type: 1,
    sighash_label: 'SIGHASH_ALL',
    preimage_hex:
      '0100000001aabb010000001976a914cc88acffffffff01010000000000000001510000000001000000',
    digest_hex: 'd21483940571a138f8c768a97f1002cc6b6b0c4df9f647feb513b881162d66e6',
    valid: true,
  },
  trace: TRACE_FIXTURE,
};

export const P2WPKH_TRACE_RESPONSE_FIXTURE: P2wpkhTraceResponse = {
  api_version: 'v1',
  script_type: 'P2WPKH',
  input_index: 0,
  scripts: {
    witness: ['30signature01', '03publickey'],
    locking: `0014${'11'.repeat(20)}`,
    script_code: `76a914${'11'.repeat(20)}88ac`,
  },
  sources: {
    witness: { transaction_txid: 'd'.repeat(64), index: 0 },
    script_pubkey: { transaction_txid: 'e'.repeat(64), index: 2 },
  },
  signature: {
    algorithm: 'ECDSA/secp256k1',
    signature_hex: '30signature',
    public_key_hex: '03publickey',
    sighash_type: 1,
    sighash_label: 'SIGHASH_ALL',
    preimage_hex: '02000000bip14301000000',
    digest_hex: 'c'.repeat(64),
    valid: true,
    hash_prevouts_hex: 'a'.repeat(64),
    hash_sequence_hex: 'b'.repeat(64),
    hash_outputs_hex: 'c'.repeat(64),
    script_code_hex: `1976a914${'11'.repeat(20)}88ac`,
    amount_sats: 42,
  },
  trace: TRACE_FIXTURE,
};
