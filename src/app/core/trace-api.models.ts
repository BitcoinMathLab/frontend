export interface SpentOutputRequest {
  readonly amount_sats: number;
  readonly script_pubkey_hex: string;
}

export interface P2pkhTraceRequest {
  readonly transaction_hex: string;
  readonly input_index: number;
  readonly spent_outputs: readonly SpentOutputRequest[];
}

export interface EcdsaSignatureVerificationRequest extends P2pkhTraceRequest {
  readonly der_signature_hex: string;
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
  readonly sources: {
    readonly script_sig: ScriptSource;
    readonly script_pubkey: ScriptSource;
  };
  readonly signature: SignatureVerification;
  readonly trace: ExecutionTrace;
}

export interface P2wpkhTraceResponse {
  readonly api_version: 'v1';
  readonly script_type: 'P2WPKH';
  readonly input_index: number;
  readonly scripts: {
    readonly witness: readonly [string, string];
    readonly locking: string;
    readonly script_code: string;
  };
  readonly sources: {
    readonly witness: ScriptSource;
    readonly script_pubkey: ScriptSource;
  };
  readonly signature: SegwitV0SignatureVerification;
  readonly trace: ExecutionTrace;
}

export interface P2msTraceResponse {
  readonly api_version: 'v1';
  readonly script_type: 'P2MS';
  readonly input_index: number;
  readonly scripts: {
    readonly unlocking: string;
    readonly locking: string;
    readonly combined: string;
  };
  readonly sources: {
    readonly script_sig: ScriptSource;
    readonly script_pubkey: ScriptSource;
  };
  readonly multisig: {
    readonly required_signatures: number;
    readonly total_public_keys: number;
    readonly signatures: readonly string[];
    readonly public_keys: readonly string[];
    readonly has_null_dummy: boolean;
  };
  readonly trace: ExecutionTrace;
}

export type SpendTraceResponse = P2pkhTraceResponse | P2wpkhTraceResponse | P2msTraceResponse;

export type P2pkhSignatureVerificationResponse = Omit<P2pkhTraceResponse, 'trace'>;
export type P2wpkhSignatureVerificationResponse = Omit<P2wpkhTraceResponse, 'trace'>;
export type EcdsaSignatureVerificationResponse =
  P2pkhSignatureVerificationResponse | P2wpkhSignatureVerificationResponse;
export type SignatureWalkthroughResult =
  P2pkhTraceResponse | P2wpkhTraceResponse | EcdsaSignatureVerificationResponse;

export interface TraceScripts {
  readonly unlocking: string;
  readonly locking: string;
  readonly combined: string;
}

export interface TraceSources {
  readonly script_sig: ScriptSource;
  readonly script_pubkey: ScriptSource;
}

export interface ScriptSource {
  readonly transaction_txid: string;
  readonly index: number;
}

export interface SignatureVerification {
  readonly algorithm: 'ECDSA/secp256k1';
  readonly signature_hex: string;
  readonly public_key_hex: string;
  readonly sighash_type: number;
  readonly sighash_label: string;
  readonly preimage_hex: string;
  readonly digest_hex: string;
  readonly valid: boolean;
}

export interface SegwitV0SignatureVerification extends SignatureVerification {
  readonly hash_prevouts_hex: string;
  readonly hash_sequence_hex: string;
  readonly hash_outputs_hex: string;
  readonly script_code_hex: string;
  readonly amount_sats: number;
}

export type OutputType = 'P2PK' | 'P2PKH' | 'P2MS' | 'P2SH' | 'P2WPKH' | 'P2WSH' | 'P2TR';

export interface PreviousOutputContext {
  readonly txid: string;
  readonly vout: number;
  readonly amount_sats: number;
  readonly script_pubkey_hex: string;
  readonly output_type: OutputType | null;
  readonly spend_type:
    | 'P2PK'
    | 'P2PKH'
    | 'P2MS'
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
  readonly script_sig_hex: string;
  readonly witness_hex: readonly string[];
}

export interface TransactionOutputContext {
  readonly vout: number;
  readonly amount_sats: number;
  readonly script_pubkey_hex: string;
  readonly output_type: OutputType | null;
}

export interface TransactionByteFieldResponse {
  readonly id: string;
  readonly label: string;
  readonly group: 'header' | 'input' | 'output' | 'witness' | 'footer';
  readonly offset: number;
  readonly length: number;
  readonly hex: string;
  readonly decoded: string;
}

export interface TransactionContextResponse {
  readonly api_version: 'v1';
  readonly txid: string;
  readonly wtxid: string;
  readonly transaction_hex: string;
  readonly version: number;
  readonly locktime: number;
  readonly is_segwit: boolean;
  readonly is_coinbase: boolean;
  readonly total_input_sats: number;
  readonly total_output_sats: number;
  readonly fee_sats: number | null;
  readonly size_bytes: number;
  readonly weight_units: number;
  readonly virtual_size_vbytes: number;
  readonly byte_fields?: readonly TransactionByteFieldResponse[];
  readonly outputs: readonly TransactionOutputContext[];
  readonly spent_outputs: readonly PreviousOutputContext[];
}

export interface TransactionExample {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly txid: string;
  readonly input_count: number;
  readonly output_count: number;
  readonly expected_spend_types: readonly string[];
  readonly concepts: readonly string[];
}

export interface TransactionExamplesResponse {
  readonly api_version: 'v1';
  readonly examples: readonly TransactionExample[];
}
