import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { GENESIS_BLOCK_HASH, LEGACY_TXID, P2WPKH_TXID } from '../../core/bitcoin-object-fixtures';
import { Display } from './display';

describe('Display', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Display],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders four semantic tabs and drills from ordered fields into shared details', () => {
    const fixture = TestBed.createComponent(Display);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const tabs = [...element.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    expect(tabs.map((tab) => tab.textContent?.trim().replace(/\s+/g, ' '))).toEqual([
      'Block',
      'Transaction',
      'TxIn',
      'TxOut',
    ]);
    expect(element.querySelector('h1')?.textContent).toBe('Object Display');
    expect(element.querySelectorAll('h1, h2')).toHaveLength(1);
    expect(element.textContent).toContain('Reveal all 285 bytes');
    const blockId = [...element.querySelectorAll<HTMLButtonElement>('button.field')].find(
      (button) => button.querySelector('strong')?.textContent === 'Block ID',
    )!;
    expect(blockId.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('.details')?.textContent).toContain(
      'identifies this block in the blockchain',
    );
    const blockVersion = [...element.querySelectorAll<HTMLButtonElement>('button.field')].find(
      (button) => button.querySelector('strong')?.textContent === 'Version',
    )!;
    blockVersion.click();
    fixture.detectChanges();
    expect(element.querySelector('.details')?.textContent).toContain('Header version');
    blockId.click();
    fixture.detectChanges();
    expect(element.querySelector('.details')?.textContent).toContain(
      'identifies this block in the blockchain',
    );

    tabs[1].click();
    fixture.detectChanges();
    expect(element.querySelector('h1')?.textContent).toBe('Object Display');

    const inputs = [...element.querySelectorAll<HTMLDetailsElement>('.field--collection')].find(
      (collection) => collection.querySelector('summary')?.textContent?.includes('Inputs'),
    )!;
    inputs.open = true;
    const input = inputs.querySelector<HTMLDetailsElement>('.collection__member')!;
    input.open = true;
    const scriptSigField = [
      ...input.querySelectorAll<HTMLButtonElement>('.collection__field'),
    ].find((button) => button.querySelector('strong')?.textContent === 'Input 0 · scriptSig')!;
    scriptSigField.click();
    fixture.detectChanges();
    expect(scriptSigField.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('.details')?.textContent).toContain('Input 0 · scriptSig');
    expect(element.querySelector('.details')?.textContent).toContain('Byte range42–148');

    const versionBytes = [...element.querySelectorAll<HTMLButtonElement>('button.field')].find(
      (button) => button.querySelector('strong')?.textContent === 'Version',
    )!;
    versionBytes.click();
    fixture.detectChanges();
    expect(versionBytes.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('.details')?.textContent).toContain('Version');

    expect(
      [...element.querySelectorAll<HTMLElement>('.fields > .field')].map((card) =>
        card.querySelector('strong')?.textContent?.trim(),
      ),
    ).toEqual(['Transaction ID', 'Version', 'Inputs', 'Outputs', 'Locktime']);
  });

  it('supports arrow-key tab selection and shows witness as separate TxIn context', () => {
    const fixture = TestBed.createComponent(Display);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const tabs = element.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();

    expect(tabs[3].getAttribute('aria-selected')).toBe('true');
    tabs[2].click();
    fixture.detectChanges();
    expect(element.querySelector('.details')?.textContent).toContain('Witness placement');
    expect(element.querySelector('.details')?.textContent).toContain(
      'Serialized separately after all outputs',
    );
    expect(element.textContent).toContain('Previous-output amount');
  });

  it('opens a labelled modal, traps focus, closes with Escape, and restores focus', async () => {
    const fixture = TestBed.createComponent(Display);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const transactions = element.querySelector<HTMLDetailsElement>('.field--collection')!;
    transactions.open = true;
    const reference = transactions.querySelector<HTMLButtonElement>('.transaction-card')!;
    reference.focus();
    reference.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = element.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-labelledby')).toBe('object-modal-title-genesis-transaction');
    expect(dialog.textContent).not.toContain('Related object quick view');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close object display');
    expect(document.body.style.overflow).toBe('hidden');
    expect(dialog.textContent).toContain('Open full page');

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), summary, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(first);
    first.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    expect(document.activeElement).toBe(last);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(reference);
  });

  it('renders a fixture-only selector for every object kind', async () => {
    const fixture = TestBed.createComponent(Display);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const tabs = element.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    expect(element.querySelector<HTMLInputElement>('#block-id')?.value).toBe(GENESIS_BLOCK_HASH);
    expect(element.querySelector('#object-index')).toBeNull();

    tabs[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('#transaction-id')?.value).toBe(LEGACY_TXID);
    expect(element.querySelector('#object-index')).toBeNull();

    tabs[2].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('#transaction-id')?.value).toBe(P2WPKH_TXID);
    expect(element.querySelector<HTMLInputElement>('#object-index')?.value).toBe('0');
    expect(element.textContent).toContain('Input index');
    const copyButton = element.querySelector<HTMLButtonElement>(
      '[aria-label="Copy transaction ID"]',
    )!;
    expect(
      element
        .querySelector<HTMLInputElement>('#object-index')!
        .compareDocumentPosition(copyButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(element.textContent).not.toContain('Input ID');
    expect(element.textContent).toContain('Previous txid');
    expect(element.textContent).not.toContain('· final');
    expect(element.querySelector('h1')?.textContent).toBe('Object Display');

    tabs[3].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('#transaction-id')?.value).toBe(LEGACY_TXID);
    expect(element.querySelector<HTMLInputElement>('#object-index')?.value).toBe('0');
    expect(element.textContent).toContain('Output index');
    expect(element.textContent).not.toContain('Output ID');
    expect(element.textContent).toContain('Amount');
  });

  it('selects local fixtures by transaction ID and input or output index', async () => {
    const fixture = TestBed.createComponent(Display);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const tabs = element.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    tabs[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const transactionId = element.querySelector<HTMLInputElement>('#transaction-id')!;
    transactionId.value = P2WPKH_TXID;
    transactionId.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    element.querySelector<HTMLFormElement>('.object-selector')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(element.querySelector('.details')?.textContent).toContain(P2WPKH_TXID);
    expect(element.querySelector('[role="alert"]')).toBeNull();

    tabs[2].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const inputTransactionId = element.querySelector<HTMLInputElement>('#transaction-id')!;
    const inputIndex = element.querySelector<HTMLInputElement>('#object-index')!;
    inputTransactionId.value = LEGACY_TXID;
    inputTransactionId.dispatchEvent(new Event('input'));
    inputIndex.value = '0';
    inputIndex.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    element.querySelector<HTMLFormElement>('.object-selector')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(element.querySelector('.details h4')?.textContent).toContain('Previous txid');
    expect(element.querySelector('.details')?.textContent).not.toContain(`${LEGACY_TXID}:0`);

    inputIndex.value = '-1';
    inputIndex.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    element.querySelector<HTMLFormElement>('.object-selector')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(inputTransactionId.getAttribute('aria-invalid')).toBeNull();
    expect(inputIndex.getAttribute('aria-invalid')).toBe('true');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'non-negative input index',
    );

    inputIndex.value = '1';
    inputIndex.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    element.querySelector<HTMLFormElement>('.object-selector')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'transaction input is not available',
    );

    tabs[3].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('#transaction-id')?.value).toBe(LEGACY_TXID);
    expect(element.querySelector<HTMLInputElement>('#object-index')?.value).toBe('0');
    element.querySelector<HTMLFormElement>('.object-selector')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(element.querySelector('.details h4')?.textContent).toContain('Amount');
    expect(element.querySelector('.details')?.textContent).not.toContain(`${LEGACY_TXID}:0`);
  });

  it('supports copy, paste, random, and clear controls for the active selector', async () => {
    const previousClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    let copied = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          copied = value;
        },
        readText: async () => 'f'.repeat(64),
      },
    });

    try {
      const fixture = TestBed.createComponent(Display);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const input = element.querySelector<HTMLInputElement>('#block-id')!;
      const copy = element.querySelector<HTMLButtonElement>('[aria-label="Copy block ID"]')!;
      const paste = element.querySelector<HTMLButtonElement>('[aria-label="Paste block ID"]')!;
      const random = element.querySelector<HTMLButtonElement>(
        '[aria-label="Use random block ID"]',
      )!;
      const clear = [
        ...element.querySelectorAll<HTMLButtonElement>('.object-selector button'),
      ].find((button) => button.textContent?.trim() === 'Clear')!;

      expect(input.value).toHaveLength(64);
      copy.click();
      await fixture.whenStable();
      expect(copied).toBe(input.value);

      paste.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(input.value).toBe('f'.repeat(64));
      element
        .querySelector<HTMLFormElement>('.object-selector')!
        .dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      expect(element.textContent).toContain('not available in the Stage 1 display');

      clear.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(input.value).toBe('');
      expect(element.querySelector('[role="alert"]')).toBeNull();

      random.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(input.value).not.toBe('f'.repeat(64));
      expect(element.querySelector('[role="alert"]')).toBeNull();

      element.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const transactionInput = element.querySelector<HTMLInputElement>('#transaction-id')!;
      const initialTransaction = transactionInput.value;
      element.querySelector<HTMLButtonElement>('[aria-label="Use random transaction ID"]')!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(transactionInput.value).not.toBe(initialTransaction);
      expect(element.querySelector('.details')?.textContent).toContain(transactionInput.value);
    } finally {
      if (previousClipboard) {
        Object.defineProperty(navigator, 'clipboard', previousClipboard);
      } else {
        delete (navigator as { clipboard?: Clipboard }).clipboard;
      }
    }
  });
});
