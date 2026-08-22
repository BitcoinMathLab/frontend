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
  spent_outputs: [
    {
      txid: 'a'.repeat(64),
      vout: 1,
      amount_sats: 125_000,
      script_pubkey_hex: '76a91400112288ac',
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
    expect(fixture.nativeElement.textContent).toContain('4 bytes');
    expect(fixture.nativeElement.textContent).toContain('76a91400112288ac');

    const clear = fixture.nativeElement.querySelector('.field-action-button') as HTMLButtonElement;
    clear.click();
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('');
    expect(fixture.nativeElement.querySelector('.result')).toBeNull();
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
