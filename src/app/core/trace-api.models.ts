export interface SpentOutputRequest {
  readonly amount_sats: number;
  readonly script_pubkey_hex: string;
}

export interface P2pkhTraceRequest {
  readonly transaction_hex: string;
  readonly input_index: number;
  readonly spent_outputs: readonly SpentOutputRequest[];
}

export interface StackSnapshot {
  readonly depth: number;
  readonly items: readonly string[];
}

export interface TraceDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly step_index: number | null;
  readonly opcode_name: string | null;
}

export interface OpcodeMetadata {
  readonly name: string;
  readonly value: number;
  readonly hex: string;
  readonly byte_offset: number;
  readonly byte_length: number;
  readonly raw: string;
  readonly is_push: boolean;
  readonly push_data: string | null;
}

export interface TraceStep {
  readonly index: number;
  readonly opcode: OpcodeMetadata;
  readonly stacks: {
    readonly before: { readonly main: StackSnapshot; readonly alt: StackSnapshot };
    readonly after: { readonly main: StackSnapshot; readonly alt: StackSnapshot };
  };
  readonly explanation: string;
  readonly diagnostic: TraceDiagnostic | null;
}

export interface ExecutionTrace {
  readonly schema_version: 1;
  readonly script: string;
  readonly success: boolean;
  readonly steps: readonly TraceStep[];
  readonly diagnostic: TraceDiagnostic | null;
}

export interface P2pkhTraceResponse {
  readonly api_version: 'v1';
  readonly script_type: 'P2PKH';
  readonly input_index: number;
  readonly scripts: {
    readonly unlocking: string;
    readonly locking: string;
    readonly combined: string;
  };
  readonly trace: ExecutionTrace;
}

export interface PreviousOutputContext {
  readonly txid: string;
  readonly vout: number;
  readonly amount_sats: number;
  readonly script_pubkey_hex: string;
  readonly output_type: 'P2PK' | 'P2PKH' | 'P2MS' | 'P2SH' | 'P2WPKH' | 'P2WSH' | 'P2TR' | null;
  readonly spend_type:
    | 'P2PK'
    | 'P2PKH'
    | 'P2SH'
    | 'P2SH-P2WPKH'
    | 'P2SH-P2WSH'
    | 'P2WPKH'
    | 'P2WSH'
    | 'P2TR-KEY-PATH'
    | 'P2TR-SCRIPT-PATH'
    | 'UNKNOWN';
  readonly is_nested: boolean;
  readonly redeem_script_hex: string | null;
}

export interface TransactionContextResponse {
  readonly api_version: 'v1';
  readonly txid: string;
  readonly transaction_hex: string;
  readonly is_coinbase: boolean;
  readonly spent_outputs: readonly PreviousOutputContext[];
}
