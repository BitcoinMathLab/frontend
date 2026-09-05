import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import { P2msTraceResponse } from '../../core/trace-api.models';
import { P2WPKH_TRACE_RESPONSE_FIXTURE, TRACE_RESPONSE_FIXTURE } from '../../testing/trace.fixture';
import { ScriptVisualizer } from './script-visualizer';

const P2MS_TRACE_RESPONSE_FIXTURE: P2msTraceResponse = {
  api_version: 'v1',
  script_type: 'P2MS',
  input_index: 0,
  scripts: TRACE_RESPONSE_FIXTURE.scripts,
  sources: TRACE_RESPONSE_FIXTURE.sources,
  multisig: {
    required_signatures: 2,
    total_public_keys: 3,
    signatures: ['30signature01', '30signature02'],
    public_keys: ['04publickey1', '04publickey2', '04publickey3'],
    has_null_dummy: true,
  },
  trace: TRACE_RESPONSE_FIXTURE.trace,
};

describe('ScriptVisualizer', () => {
  it('progressively reveals a random curated P2PKH trace and its execution workspace', async () => {
    const loadP2pkhTrace = vi.fn().mockReturnValue(of(TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [
        { provide: TraceApi, useValue: { loadP2pkhTrace } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();

    expect(loadP2pkhTrace).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Stack visualizer');
    expect(fixture.nativeElement.textContent).toContain('Random');
    expect(fixture.nativeElement.textContent).not.toContain('Prepare this input for execution');
    expect(fixture.nativeElement.textContent).not.toContain('Signature type');
    expect(fixture.nativeElement.textContent).not.toContain('Step 0 of 4');
    (
      [...fixture.nativeElement.querySelectorAll('button')].find(
        (button: HTMLButtonElement) => button.textContent?.trim() === 'Random',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(loadP2pkhTrace).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Find spent output');
    expect(fixture.nativeElement.textContent).toContain('Prepare this input for execution');
    expect(fixture.nativeElement.textContent).toContain('Main stack');
    expect(fixture.nativeElement.textContent).toContain('Empty');
    expect(fixture.nativeElement.textContent).not.toContain('Script preparation');
    expect(fixture.nativeElement.textContent).not.toContain('Signature type');
    expect(fixture.nativeElement.textContent).not.toContain('Step 0 of 4');
    expect(fixture.nativeElement.textContent).not.toContain('Stack flow');
    (
      [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) =>
        button.textContent?.includes('Find spent output'),
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Contains the amount and locking condition',
    );
    (
      [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) =>
        button.textContent?.includes('Assemble execution'),
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Prepare this input for execution');
    expect(
      fixture.nativeElement.querySelector(
        '[aria-label="Transaction relationship for script execution"]',
      ),
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Stack flow');
    expect(fixture.nativeElement.textContent).toContain('scriptSig');
    expect(fixture.nativeElement.textContent).toContain('scriptPubKey');
    expect(fixture.nativeElement.textContent).toContain('Stack state');
    expect(fixture.nativeElement.textContent).toContain('Execution');
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 4');
    expect(fixture.nativeElement.textContent).toContain('Empty stack');
    expect(fixture.nativeElement.textContent).not.toContain('Value');
    expect(fixture.nativeElement.textContent).not.toContain('OP_DUP sandbox');
    expect(fixture.nativeElement.textContent).not.toContain('Valid spend');
  });

  it('clears every loaded and assembled trace state before starting again', async () => {
    const loadP2pkhTrace = vi.fn().mockReturnValue(of(TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [
        { provide: TraceApi, useValue: { loadP2pkhTrace } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();
    const button = (label: string): HTMLButtonElement =>
      [...fixture.nativeElement.querySelectorAll('button')].find(
        (candidate: HTMLButtonElement) => candidate.textContent?.trim() === label,
      ) as HTMLButtonElement;

    button('Random').click();
    fixture.detectChanges();
    button('Find spent output').click();
    fixture.detectChanges();
    button('Assemble execution').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.execution-context')).not.toBeNull();

    button('Clear').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.execution-context')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Prepare this input for execution');
    expect(fixture.nativeElement.textContent).not.toContain('Signature type');
    expect(fixture.nativeElement.textContent).not.toContain('Step 0 of 4');
    expect(fixture.nativeElement.textContent).not.toContain('Clear');
    expect(
      (
        fixture.nativeElement.querySelector(
          '[name="visualizer-transaction-id"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Trace input');
    expect(fixture.nativeElement.textContent).toContain('Random');

    button('Random').click();
    fixture.detectChanges();
    expect(loadP2pkhTrace).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Find spent output');
  });

  it('shows a safe retry state and recovers on the next request', async () => {
    const loadP2pkhTrace = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('private network detail')))
      .mockReturnValueOnce(of(TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [
        { provide: TraceApi, useValue: { loadP2pkhTrace } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();
    (
      [...fixture.nativeElement.querySelectorAll('button')].find(
        (button: HTMLButtonElement) => button.textContent?.trim() === 'Random',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('The walkthrough could not load.');
    expect(fixture.nativeElement.textContent).not.toContain('private network detail');

    (fixture.nativeElement.querySelector('.state-card button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(loadP2pkhTrace).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Find spent output');
  });

  it('builds a trace request from a selected real P2PKH input', async () => {
    const txid = 'a'.repeat(64);
    const loadTransactionContext = vi.fn().mockReturnValue(
      of({
        transaction_hex: '01000000',
        spent_outputs: [{ spend_type: 'P2PKH', amount_sats: 42, script_pubkey_hex: '76a91400' }],
      }),
    );
    const loadP2pkhTrace = vi.fn().mockReturnValue(of(TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [
        { provide: TraceApi, useValue: { loadTransactionContext, loadP2pkhTrace } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: (name: string) => (name === 'txid' ? txid : '0') },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();

    expect(loadTransactionContext).toHaveBeenCalledWith(txid);
    expect(loadP2pkhTrace).toHaveBeenCalledWith({
      transaction_hex: '01000000',
      input_index: 0,
      spent_outputs: [{ amount_sats: 42, script_pubkey_hex: '76a91400' }],
    });
  });

  it('loads an arbitrary P2PKH input from the visualizer source form', async () => {
    const txid = 'b'.repeat(64);
    const loadTransactionContext = vi.fn().mockReturnValue(
      of({
        transaction_hex: '02000000',
        spent_outputs: [
          { spend_type: 'P2WPKH', amount_sats: 10, script_pubkey_hex: '001400' },
          { spend_type: 'P2PKH', amount_sats: 20, script_pubkey_hex: '76a91411' },
        ],
      }),
    );
    const loadP2pkhTrace = vi.fn().mockReturnValue(of(TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [
        { provide: TraceApi, useValue: { loadTransactionContext, loadP2pkhTrace } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as {
      transactionId: string;
      inputIndex: number;
      loadSelectedInput(): void;
    };
    component.transactionId = txid;
    component.inputIndex = 1;
    component.loadSelectedInput();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(loadTransactionContext).toHaveBeenCalledWith(txid);
    expect(loadP2pkhTrace).toHaveBeenLastCalledWith({
      transaction_hex: '02000000',
      input_index: 1,
      spent_outputs: [
        { amount_sats: 10, script_pubkey_hex: '001400' },
        { amount_sats: 20, script_pubkey_hex: '76a91411' },
      ],
    });
  });

  it('loads witness and scriptPubKey material for a modern signature input', async () => {
    const txid = 'd'.repeat(64);
    const loadTransactionContext = vi.fn().mockReturnValue(
      of({
        transaction_hex: '020000000001',
        spent_outputs: [
          {
            txid: 'e'.repeat(64),
            vout: 2,
            spend_type: 'P2WPKH',
            amount_sats: 20,
            script_pubkey_hex: '0014' + '11'.repeat(20),
            script_sig_hex: '',
            witness_hex: ['30signature', '03publickey'],
          },
        ],
      }),
    );
    const loadP2pkhTrace = vi.fn().mockReturnValue(of(TRACE_RESPONSE_FIXTURE));
    const loadP2wpkhTrace = vi.fn().mockReturnValue(of(P2WPKH_TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [
        {
          provide: TraceApi,
          useValue: { loadTransactionContext, loadP2pkhTrace, loadP2wpkhTrace },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as {
      transactionId: string;
      inputIndex: number;
      loadSelectedInput(): void;
    };
    component.transactionId = txid;
    component.inputIndex = 0;
    component.loadSelectedInput();
    fixture.detectChanges();

    expect(loadP2wpkhTrace).toHaveBeenCalledWith({
      transaction_hex: '020000000001',
      input_index: 0,
      spent_outputs: [{ amount_sats: 20, script_pubkey_hex: '0014' + '11'.repeat(20) }],
    });
    expect(fixture.nativeElement.textContent).toContain('Find spent output');
    expect(fixture.nativeElement.textContent).not.toContain('SegWit ECDSA · P2WPKH');
    (
      [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) =>
        button.textContent?.includes('Find spent output'),
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (
      [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) =>
        button.textContent?.includes('Assemble execution'),
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (
      [...fixture.nativeElement.querySelectorAll('[role="tab"]')].find(
        (tab: HTMLButtonElement) => tab.textContent?.trim() === 'Signature',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SegWit ECDSA · P2WPKH');
    expect(fixture.nativeElement.textContent).toContain('30signature');
    expect(fixture.nativeElement.textContent).toContain('03publickey');
    expect(fixture.nativeElement.textContent).toContain('selected UTXO');
    expect(fixture.nativeElement.textContent).not.toContain('not yet available for P2WPKH');
  });

  it('routes bare P2MS to its verified stack trace and keeps signature claims precise', async () => {
    const txid = '9'.repeat(64);
    const previousTxid = '5'.repeat(64);
    const loadTransactionContext = vi.fn().mockReturnValue(
      of({
        transaction_hex: '01000000',
        spent_outputs: [
          {
            txid: previousTxid,
            vout: 0,
            spend_type: 'P2MS',
            amount_sats: 1_690_000,
            script_pubkey_hex: '5241aa51ae',
            script_sig_hex: '004830signature',
            witness_hex: [],
          },
        ],
      }),
    );
    const loadP2pkhTrace = vi.fn();
    const loadP2msTrace = vi.fn().mockReturnValue(of(P2MS_TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [
        {
          provide: TraceApi,
          useValue: { loadTransactionContext, loadP2pkhTrace, loadP2msTrace },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as {
      transactionId: string;
      inputIndex: number;
      loadSelectedInput(): void;
    };
    component.transactionId = txid;
    component.inputIndex = 0;
    component.loadSelectedInput();
    fixture.detectChanges();

    expect(loadP2msTrace).toHaveBeenCalledWith({
      transaction_hex: '01000000',
      input_index: 0,
      spent_outputs: [{ amount_sats: 1_690_000, script_pubkey_hex: '5241aa51ae' }],
    });
    expect(loadP2pkhTrace).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Find spent output');
    const button = (label: string): HTMLButtonElement =>
      [...fixture.nativeElement.querySelectorAll('button')].find((candidate: HTMLButtonElement) =>
        candidate.textContent?.includes(label),
      ) as HTMLButtonElement;
    button('Find spent output').click();
    fixture.detectChanges();
    button('Assemble execution').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('P2MS');
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 4');

    button('Signature').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'P2MS signature walkthrough not yet available',
    );
    expect(fixture.nativeElement.textContent).toContain('2 of 3');
    expect(fixture.nativeElement.textContent).toContain('Empty NULLDUMMY present');
    expect(fixture.nativeElement.textContent).not.toContain('Verify a DER signature');
  });

  it('verifies a standalone DER signature with context loaded from its transaction ID', async () => {
    const txid = 'f'.repeat(64);
    const context = {
      transaction_hex: '01000000',
      spent_outputs: [
        {
          spend_type: 'P2PKH',
          amount_sats: 42,
          script_pubkey_hex: '76a91400',
        },
      ],
    };
    const loadP2pkhTrace = vi.fn().mockReturnValue(of(TRACE_RESPONSE_FIXTURE));
    const loadTransactionContext = vi.fn().mockReturnValue(of(context));
    const verificationResult = { ...TRACE_RESPONSE_FIXTURE };
    delete (verificationResult as { trace?: unknown }).trace;
    const verifyEcdsaSignature = vi.fn().mockReturnValue(of(verificationResult));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [
        {
          provide: TraceApi,
          useValue: { loadP2pkhTrace, loadTransactionContext, verifyEcdsaSignature },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();
    (
      [...fixture.nativeElement.querySelectorAll('button')].find(
        (button: HTMLButtonElement) => button.textContent?.trim() === 'Random',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (
      [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) =>
        button.textContent?.includes('Find spent output'),
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (
      [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) =>
        button.textContent?.includes('Assemble execution'),
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    const signatureTab = [...fixture.nativeElement.querySelectorAll('[role="tab"]')].find(
      (tab: HTMLButtonElement) => tab.textContent?.includes('Signature'),
    ) as HTMLButtonElement;
    signatureTab.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Verify a DER signature');
    expect(fixture.nativeElement.querySelector('.transaction-source')).not.toBeNull();

    const component = fixture.componentInstance as unknown as {
      verifierTransactionId: string;
      verifierInputIndex: number;
      derSignature: string;
      verifySignature(): void;
    };
    component.verifierTransactionId = txid;
    component.verifierInputIndex = 0;
    component.derSignature = '3006020101020101';
    component.verifySignature();
    fixture.detectChanges();

    expect(loadTransactionContext).toHaveBeenCalledWith(txid);
    expect(verifyEcdsaSignature).toHaveBeenCalledWith({
      transaction_hex: context.transaction_hex,
      input_index: 0,
      spent_outputs: [{ amount_sats: 42, script_pubkey_hex: '76a91400' }],
      der_signature_hex: '3006020101020101',
    });
    expect(fixture.nativeElement.textContent).toContain('Signature walkthrough ready');
  });

  it('retries the selected transaction input after its trace request fails', async () => {
    const txid = 'c'.repeat(64);
    const context = {
      transaction_hex: '02000000',
      spent_outputs: [{ spend_type: 'P2PKH', amount_sats: 20, script_pubkey_hex: '76a91411' }],
    };
    const loadTransactionContext = vi.fn().mockReturnValue(of(context));
    const loadP2pkhTrace = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('temporary failure')))
      .mockReturnValueOnce(of(TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [
        { provide: TraceApi, useValue: { loadTransactionContext, loadP2pkhTrace } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as {
      transactionId: string;
      inputIndex: number;
      loadSelectedInput(): void;
    };
    component.transactionId = txid;
    component.inputIndex = 0;
    component.loadSelectedInput();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.state-card button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(loadTransactionContext).toHaveBeenCalledTimes(2);
    expect(loadTransactionContext).toHaveBeenLastCalledWith(txid);
    expect(loadP2pkhTrace).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Find spent output');
  });

  it('rejects an invalid transaction link without making an API request', async () => {
    const loadTransactionContext = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [
        { provide: TraceApi, useValue: { loadTransactionContext } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: (name: string) => (name === 'txid' ? 'bad' : '0') } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();

    expect(loadTransactionContext).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'The transaction ID in this visualizer link is invalid.',
    );
  });
});
