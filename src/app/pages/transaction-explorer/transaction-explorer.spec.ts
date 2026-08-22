import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import { TransactionContextResponse } from '../../core/trace-api.models';
import { TransactionExplorer } from './transaction-explorer';

const TXID = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';
const RESPONSE: TransactionContextResponse = {
  api_version: 'v1',
  txid: TXID,
  transaction_hex: '01020304',
  is_coinbase: false,
  outputs: [
    {
      vout: 0,
      amount_sats: 556_000_000,
      script_pubkey_hex: '76a914c398efa9c392ba6013c5e04ee729755ef7f58b3288ac',
    },
    {
      vout: 1,
      amount_sats: 4_444_000_000,
      script_pubkey_hex: '76a914948c765a6914d43f2a7ac177da2c2f6b52de3d7c88ac',
    },
  ],
  spent_outputs: [
    {
      txid: 'a'.repeat(64),
      vout: 1,
      amount_sats: 125_000,
      script_pubkey_hex: '76a91400112288ac',
      output_type: 'P2SH',
      spend_type: 'P2SH-P2WPKH',
      is_nested: true,
      redeem_script_hex: '001400112233445566778899aabbccddeeff00112233',
    },
  ],
};

describe('TransactionExplorer', () => {
  it('loads and presents transaction context', async () => {
    const loadTransactionContext = vi.fn().mockReturnValue(of(RESPONSE));
    await TestBed.configureTestingModule({
      imports: [TransactionExplorer],
      providers: [{ provide: TraceApi, useValue: { loadTransactionContext } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(TransactionExplorer);
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
    expect(fixture.nativeElement.textContent).toContain('4 bytes');
    expect(fixture.nativeElement.textContent).toContain('76a91400112288ac');
    expect(fixture.nativeElement.textContent).toContain('P2SH-P2WPKH');
    expect(fixture.nativeElement.textContent).toContain(
      '001400112233445566778899aabbccddeeff00112233',
    );

    const clear = fixture.nativeElement.querySelector('.clear-button') as HTMLButtonElement;
    clear.click();
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('');
    expect(fixture.nativeElement.querySelector('.result')).toBeNull();
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
      providers: [{ provide: TraceApi, useValue: { loadTransactionContext } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(TransactionExplorer);
    fixture.detectChanges();

    const copy = fixture.nativeElement.querySelector(
      '[aria-label="Copy transaction ID"]',
    ) as HTMLButtonElement;
    copy.click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith(TXID);

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
      providers: [{ provide: TraceApi, useValue: { loadTransactionContext } }],
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
      providers: [{ provide: TraceApi, useValue: { loadTransactionContext } }],
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
