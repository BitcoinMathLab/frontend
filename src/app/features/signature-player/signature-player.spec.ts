import { TestBed } from '@angular/core/testing';

import { TRACE_RESPONSE_FIXTURE } from '../../testing/trace.fixture';
import { SignaturePlayer } from './signature-player';

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
});
