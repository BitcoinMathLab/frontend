import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import {
  TransactionContextResponse,
  TransactionExamplesResponse,
} from '../../core/trace-api.models';
import { TransactionExplorer } from './transaction-explorer';

const TXID = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';
const GENESIS_TXID = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';
const TRANSACTION_HEX =
  '01000000' +
  '01' +
  '00'.repeat(32) +
  'ffffffff' +
  '00' +
  'ffffffff' +
  '02' +
  'e803000000000000' +
  '01' +
  '51' +
  'd007000000000000' +
  '01' +
  '51' +
  '00000000';
const EXAMPLES_RESPONSE: TransactionExamplesResponse = {
  api_version: 'v1',
  examples: [
    {
      slug: 'genesis-coinbase',
      title: 'Genesis coinbase',
      description: "Inspect Bitcoin's block-zero coinbase and the output it created.",
      txid: GENESIS_TXID,
      input_count: 0,
      output_count: 1,
      expected_spend_types: [],
      concepts: ['coinbase', 'block zero', 'created output'],
    },
    {
      slug: 'legacy-p2pkh',
      title: 'Legacy P2PKH spend',
      description: 'Follow a classic pay-to-public-key-hash input and its two outputs.',
      txid: TXID,
      input_count: 1,
      output_count: 2,
      expected_spend_types: ['P2PKH'],
      concepts: ['legacy', 'P2PKH', 'scriptSig'],
    },
  ],
};
const RESPONSE: TransactionContextResponse = {
  api_version: 'v1',
  txid: TXID,
  wtxid: TXID,
  transaction_hex: TRANSACTION_HEX,
  version: 1,
  locktime: 0,
  is_segwit: false,
  is_coinbase: false,
  total_input_sats: 5_000_000_000,
  total_output_sats: 5_000_000_000,
  fee_sats: 0,
  size_bytes: 71,
  weight_units: 284,
  virtual_size_vbytes: 71,
  outputs: [
    {
      vout: 0,
      amount_sats: 556_000_000,
      script_pubkey_hex: '76a914c398efa9c392ba6013c5e04ee729755ef7f58b3288ac',
      output_type: 'P2PKH',
    },
    {
      vout: 1,
      amount_sats: 4_444_000_000,
      script_pubkey_hex: '76a914948c765a6914d43f2a7ac177da2c2f6b52de3d7c88ac',
      output_type: 'P2PKH',
    },
  ],
  spent_outputs: [
    {
      txid: 'a'.repeat(64),
      vout: 1,
      amount_sats: 125_000,
      script_pubkey_hex: '76a91400112288ac',
      output_type: 'P2PKH',
      spend_type: 'P2PKH',
      is_nested: false,
      redeem_script_hex: null,
    },
  ],
};

function traceApiWith(loadTransactionContext: ReturnType<typeof vi.fn>) {
  return {
    loadTransactionContext,
    loadTransactionExamples: vi.fn().mockReturnValue(of(EXAMPLES_RESPONSE)),
  };
}

describe('TransactionExplorer', () => {
  it('loads and presents transaction context', async () => {
    const loadTransactionContext = vi.fn().mockReturnValue(of(RESPONSE));
    await TestBed.configureTestingModule({
      imports: [TransactionExplorer],
      providers: [{ provide: TraceApi, useValue: traceApiWith(loadTransactionContext) }],
    }).compileComponents();
    const fixture = TestBed.createComponent(TransactionExplorer);
    fixture.detectChanges();

    const example = [...fixture.nativeElement.querySelectorAll('.example-card')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Legacy P2PKH spend'),
    ) as HTMLButtonElement;
    example.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(loadTransactionContext).toHaveBeenCalledWith(TXID);
    expect(fixture.nativeElement.textContent).toContain('125,000 sats');
    expect(fixture.nativeElement.textContent).toContain('2 output(s)');
    expect(fixture.nativeElement.textContent).toContain('556,000,000 sats');
    expect(fixture.nativeElement.textContent).toContain('4,444,000,000 sats');
    expect(fixture.nativeElement.textContent).toContain(
      '76a914948c765a6914d43f2a7ac177da2c2f6b52de3d7c88ac',
    );
    expect(fixture.nativeElement.textContent).toContain('71 bytes');
    expect(fixture.nativeElement.textContent).toContain('Legacy');
    expect(fixture.nativeElement.textContent).toContain('Version');
    expect(fixture.nativeElement.textContent).toContain('Locktime');
    expect(fixture.nativeElement.textContent).toContain(TXID);
    expect(fixture.nativeElement.textContent).toContain('76a91400112288ac');
    expect(fixture.nativeElement.textContent).toContain('P2PKH');
    expect(fixture.nativeElement.textContent).toContain('Output type');
    expect(fixture.nativeElement.textContent).toContain('Transaction fee');
    expect(fixture.nativeElement.textContent).toContain('284 WU');
    expect(fixture.nativeElement.textContent).toContain('Transaction byte inspector');
    expect(fixture.nativeElement.textContent).toContain('Input 1 previous txid');
    expect(fixture.nativeElement.textContent).toContain('Selects the transaction serialization');

    const amountBytes = [...fixture.nativeElement.querySelectorAll('.byte-field')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Output 1 amount'),
    ) as HTMLButtonElement;
    amountBytes.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.byte-detail').textContent).toContain('1000 sats');
    const nextField = [...fixture.nativeElement.querySelectorAll('.byte-navigation button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Next field'),
    ) as HTMLButtonElement;
    nextField.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.byte-detail').textContent).toContain(
      'Output 1 locking-script length',
    );
    const outputTwoBytes = fixture.nativeElement.querySelector(
      '[aria-label="Locate output 2 bytes"]',
    ) as HTMLButtonElement;
    outputTwoBytes.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.byte-detail').textContent).toContain(
      'Output 2 amount',
    );
    expect(fixture.nativeElement.textContent).toContain('Fixture verified');

    const clear = fixture.nativeElement.querySelector('.clear-button') as HTMLButtonElement;
    clear.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('');
    expect(fixture.nativeElement.querySelector('.result')).toBeNull();
  });

  it('prefers canonical byte fields returned by the engine API', async () => {
    const loadTransactionContext = vi.fn().mockReturnValue(
      of({
        ...RESPONSE,
        transaction_hex: 'not-locally-decodable',
        byte_fields: [
          {
            id: 'version',
            label: 'Version from engine',
            group: 'header' as const,
            offset: 0,
            length: 4,
            hex: '01000000',
            decoded: '1 (engine authoritative)',
          },
        ],
      }),
    );
    await TestBed.configureTestingModule({
      imports: [TransactionExplorer],
      providers: [{ provide: TraceApi, useValue: traceApiWith(loadTransactionContext) }],
    }).compileComponents();
    const fixture = TestBed.createComponent(TransactionExplorer);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.byte-field')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.byte-detail').textContent).toContain(
      '1 (engine authoritative)',
    );
  });

  it('copies, pastes, and selects a curated transaction example', async () => {
    const loadTransactionContext = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const pastedTxid = 'a'.repeat(64);
    const readText = vi.fn().mockResolvedValue(pastedTxid);
    const previousClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { readText, writeText },
    });
    await TestBed.configureTestingModule({
      imports: [TransactionExplorer],
      providers: [{ provide: TraceApi, useValue: traceApiWith(loadTransactionContext) }],
    }).compileComponents();
    const fixture = TestBed.createComponent(TransactionExplorer);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Genesis coinbase');
    expect(fixture.nativeElement.textContent).toContain('0 input(s) · 1 output(s)');
    const genesis = [...fixture.nativeElement.querySelectorAll('.example-card')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Genesis coinbase'),
    ) as HTMLButtonElement;
    genesis.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe(
      GENESIS_TXID,
    );

    const copy = fixture.nativeElement.querySelector(
      '[aria-label="Copy transaction ID"]',
    ) as HTMLButtonElement;
    copy.click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith(GENESIS_TXID);

    const paste = fixture.nativeElement.querySelector(
      '[aria-label="Paste transaction ID"]',
    ) as HTMLButtonElement;
    paste.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe(
      pastedTxid,
    );

    const random = fixture.nativeElement.querySelector(
      '[aria-label="Use random transaction example"]',
    ) as HTMLButtonElement;
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    random.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const randomTxid = (fixture.nativeElement.querySelector('input') as HTMLInputElement).value;
    expect(randomTxid).toMatch(/^[0-9a-f]{64}$/);
    expect(randomTxid).not.toBe(pastedTxid);
    expect(loadTransactionContext).not.toHaveBeenCalled();
    randomSpy.mockRestore();

    if (previousClipboard) {
      Object.defineProperty(navigator, 'clipboard', previousClipboard);
    } else {
      delete (navigator as { clipboard?: Clipboard }).clipboard;
    }
  });

  it('rejects malformed transaction IDs without calling the API', async () => {
    const loadTransactionContext = vi.fn();
    await TestBed.configureTestingModule({
      imports: [TransactionExplorer],
      providers: [{ provide: TraceApi, useValue: traceApiWith(loadTransactionContext) }],
    }).compileComponents();
    const fixture = TestBed.createComponent(TransactionExplorer);
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { txid: string }).txid = 'not-a-txid';
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(loadTransactionContext).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'exactly 64 hexadecimal characters',
    );
  });

  it('shows a safe message while Bitcoin Core is unavailable', async () => {
    const loadTransactionContext = vi.fn().mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            error: { detail: 'private infrastructure detail' },
          }),
      ),
    );
    await TestBed.configureTestingModule({
      imports: [TransactionExplorer],
      providers: [{ provide: TraceApi, useValue: traceApiWith(loadTransactionContext) }],
    }).compileComponents();
    const fixture = TestBed.createComponent(TransactionExplorer);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Bitcoin Core is still catching up');
    expect(fixture.nativeElement.textContent).not.toContain('private infrastructure detail');
  });
});
