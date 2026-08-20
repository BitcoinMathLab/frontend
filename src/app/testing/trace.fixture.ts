import { ExecutionTrace, P2pkhTraceResponse } from '../core/trace-api.models';

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
  trace: TRACE_FIXTURE,
};
