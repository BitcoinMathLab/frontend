import { TestBed } from '@angular/core/testing';

import { P2WPKH_TRACE_RESPONSE_FIXTURE, TRACE_RESPONSE_FIXTURE } from '../../testing/trace.fixture';
import { SignaturePlayer } from './signature-player';

const MULTI_INPUT_LEGACY_TRANSACTION = [
  '01000000',
  '02',
  '11'.repeat(32),
  '00000000',
  '01',
  '51',
  'feffffff',
  '22'.repeat(32),
  '01000000',
  '01',
  '52',
  'fdffffff',
  '02',
  '0100000000000000',
  '01',
  '51',
  '0200000000000000',
  '01',
  '52',
  '00000000',
].join('');

const MULTI_INPUT_SEGWIT_TRANSACTION = [
  '02000000',
  '0001',
  '02',
  '11'.repeat(32),
  '00000000',
  '00',
  'ffffffff',
  '22'.repeat(32),
  '01000000',
  '00',
  'feffffff',
  '02',
  '0100000000000000',
  '01',
  '51',
  '0200000000000000',
  '01',
  '52',
  '02',
  '01',
  '30',
  '01',
  '02',
  '02',
  '01',
  '31',
  '01',
  '03',
  '00000000',
].join('');

describe('SignaturePlayer', () => {
  it('walks through signature construction and highlights committed transaction regions', async () => {
    await TestBed.configureTestingModule({ imports: [SignaturePlayer] }).compileComponents();
    const fixture = TestBed.createComponent(SignaturePlayer);
    fixture.componentRef.setInput('result', TRACE_RESPONSE_FIXTURE);
    fixture.componentRef.setInput('transactionHex', '01000000transaction');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Step 0 of 5');
    expect(fixture.nativeElement.textContent).toContain('Signature walkthrough ready');

    (
      fixture.nativeElement.querySelector('[aria-label="Next signature step"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Step 1 of 5');
    expect(fixture.nativeElement.textContent).toContain('Start with the spending transaction');
    expect(
      fixture.nativeElement.querySelectorAll('.transaction-regions article.active'),
    ).toHaveLength(2);

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Finish signature walkthrough"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Valid signature');
    expect(fixture.nativeElement.textContent).toContain(
      TRACE_RESPONSE_FIXTURE.signature.public_key_hex,
    );
  });

  it('walks through BIP143 component commitments and verifies witness ECDSA', async () => {
    await TestBed.configureTestingModule({ imports: [SignaturePlayer] }).compileComponents();
    const fixture = TestBed.createComponent(SignaturePlayer);
    fixture.componentRef.setInput('result', P2WPKH_TRACE_RESPONSE_FIXTURE);
    fixture.componentRef.setInput('transactionHex', '020000000001transaction');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('SegWit ECDSA · P2WPKH');
    expect(fixture.nativeElement.textContent).toContain('hashPrevouts');
    expect(fixture.nativeElement.textContent).toContain('hashSequence');
    expect(fixture.nativeElement.textContent).toContain('hashOutputs');
    expect(fixture.nativeElement.textContent).toContain('42 sats');

    const next = fixture.nativeElement.querySelector(
      '[aria-label="Next signature step"]',
    ) as HTMLButtonElement;
    for (let index = 0; index < 5; index += 1) {
      next.click();
      fixture.detectChanges();
    }

    expect(fixture.nativeElement.textContent).toContain('Assemble the BIP143 preimage');
    expect(fixture.nativeElement.textContent).toContain('02000000bip14301000000');
    expect(
      fixture.nativeElement.querySelectorAll('.digest-tracker > div.active').length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('keeps every legacy input and output selectable with zero-based exact fields', async () => {
    await TestBed.configureTestingModule({ imports: [SignaturePlayer] }).compileComponents();
    const fixture = TestBed.createComponent(SignaturePlayer);
    fixture.componentRef.setInput('result', TRACE_RESPONSE_FIXTURE);
    fixture.componentRef.setInput('transactionHex', MULTI_INPUT_LEGACY_TRANSACTION);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Input 0 · signed input');
    expect(fixture.nativeElement.textContent).toContain('Input 1');
    expect(fixture.nativeElement.textContent).toContain('Output 0');
    expect(fixture.nativeElement.textContent).toContain('Output 1');

    const inputOne = [...fixture.nativeElement.querySelectorAll('.input-selector button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Input 1',
    ) as HTMLButtonElement;
    inputOne.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Input 1 previous txid');
    expect(fixture.nativeElement.textContent).toContain('22'.repeat(32));

    const outputOne = [...fixture.nativeElement.querySelectorAll('.input-selector button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Output 1',
    ) as HTMLButtonElement;
    outputOne.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Output 1 amount');
    expect(fixture.nativeElement.textContent).toContain('0200000000000000');

    const next = fixture.nativeElement.querySelector(
      '[aria-label="Next signature step"]',
    ) as HTMLButtonElement;
    for (let index = 0; index < 3; index += 1) next.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('[aria-label="Transaction outputs"] .committed'),
    ).toHaveLength(2);
  });

  it('decodes and selects every SegWit input witness and output', async () => {
    await TestBed.configureTestingModule({ imports: [SignaturePlayer] }).compileComponents();
    const fixture = TestBed.createComponent(SignaturePlayer);
    fixture.componentRef.setInput('result', P2WPKH_TRACE_RESPONSE_FIXTURE);
    fixture.componentRef.setInput('transactionHex', MULTI_INPUT_SEGWIT_TRANSACTION);
    fixture.detectChanges();

    const inputOne = [...fixture.nativeElement.querySelectorAll('.input-selector button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Input 1',
    ) as HTMLButtonElement;
    inputOne.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Input 1 witness item 1');
    expect(fixture.nativeElement.textContent).toContain('Input 1 witness item 2');
    expect(fixture.nativeElement.textContent).toContain('Output 1');
  });
});
