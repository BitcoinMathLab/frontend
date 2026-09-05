import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  P2WPKH_TRACE_RESPONSE_FIXTURE,
  TRACE_FIXTURE,
  TRACE_RESPONSE_FIXTURE,
} from '../../testing/trace.fixture';
import { TracePlayer } from './trace-player';

describe('TracePlayer', () => {
  let fixture: ComponentFixture<TracePlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TracePlayer],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(TracePlayer);
    fixture.componentRef.setInput('trace', {
      ...TRACE_FIXTURE,
      steps: TRACE_FIXTURE.steps.map((step, index) => ({
        ...step,
        opcode: {
          ...step.opcode,
          is_push: index < 2,
          push_data: index < 2 ? step.opcode.raw : null,
        },
      })),
    });
    fixture.componentRef.setInput('scripts', TRACE_RESPONSE_FIXTURE.scripts);
    fixture.componentRef.setInput('sources', TRACE_RESPONSE_FIXTURE.sources);
    fixture.componentRef.setInput('inputSequence', '4294967294 · relative locktime disabled');
    fixture.componentRef.setInput('spentOutputAmountSats', 82_974_043_165);
    fixture.componentRef.setInput(
      'spentOutputScriptPubKey',
      TRACE_RESPONSE_FIXTURE.scripts.locking,
    );
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  function control(label: string): HTMLButtonElement {
    const match = fixture.nativeElement.querySelector(
      `[aria-label="${label}"]`,
    ) as HTMLButtonElement | null;
    if (!match) throw new Error(`Missing ${label} button`);
    return match;
  }

  function prepareExecution(): void {
    const findOutput = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Find spent output'),
    ) as HTMLButtonElement;
    findOutput.click();
    fixture.detectChanges();
    const assemble = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Assemble execution'),
    ) as HTMLButtonElement;
    assemble.click();
    fixture.detectChanges();
  }

  it('locates the spent TxOut before assembling the execution context', async () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).not.toContain('Selected TxIn');
    expect(compiled.textContent).not.toContain('Referenced TxOut');
    expect(compiled.textContent).not.toContain('TxIn 0');
    expect(compiled.textContent).not.toContain('TxOut 1');
    expect(compiled.textContent).toContain('Reference');
    expect(compiled.textContent).toContain('Contains the outpoint and unlocking data');
    expect(compiled.textContent).toContain('Not located yet');
    expect(compiled.textContent).toContain('Use its outpoint to find the output being spent.');
    expect(compiled.textContent).toContain('Step 1 of 2');
    expect(compiled.textContent).toContain('Prepared execution');
    expect(compiled.textContent).toContain('Waiting for Assemble');
    expect(compiled.textContent).toContain('Main stack');
    expect(compiled.textContent).toContain('Empty');
    expect(compiled.textContent).not.toContain(
      `scriptPubKey ${TRACE_RESPONSE_FIXTURE.scripts.locking}`,
    );
    expect(compiled.textContent).not.toContain('Stack flow');
    expect(compiled.querySelector('[aria-label="Next step"]')).toBeNull();
    expect(compiled.textContent).not.toContain('Signature type');
    expect(compiled.textContent).not.toContain('Step 0 of 6');

    const inputReference = compiled.querySelector<HTMLButtonElement>(
      '[aria-label="Open selected input 0 in the spending transaction"]',
    )!;
    inputReference.click();
    fixture.detectChanges();
    expect(compiled.querySelector('[role="dialog"]')?.textContent).toContain('TxIn quick view');
    expect(compiled.querySelector('[role="dialog"]')?.textContent).toContain('Previous txid');
    compiled.querySelector<HTMLButtonElement>('[aria-label="Close object display"]')!.click();
    fixture.detectChanges();

    const findOutput = [...compiled.querySelectorAll('button')].find((button: HTMLButtonElement) =>
      button.textContent?.includes('Find spent output'),
    ) as HTMLButtonElement;
    findOutput.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    const outputReference = compiled.querySelector<HTMLButtonElement>(
      '[aria-label="Open referenced output 1 in the previous transaction"]',
    )!;
    expect(outputReference).toBe(document.activeElement);
    expect(compiled.textContent).toContain('Found');
    expect(compiled.textContent).toContain('Step 2 of 2');
    expect(compiled.textContent).toContain('Contains the amount and locking condition');
    expect(compiled.textContent).toContain('Assemble execution');
    expect(compiled.textContent).not.toContain('Stack flow');

    outputReference.click();
    fixture.detectChanges();
    const outputDialog = compiled.querySelector('[role="dialog"]')!;
    expect(outputDialog.textContent).toContain('TxOut quick view');
    expect(outputDialog.textContent).toContain('82,974,043,165 sats · 829.74043165 BTC');
    expect(outputDialog.textContent).toContain('scriptPubKey size');
    expect(outputDialog.textContent).toContain(TRACE_RESPONSE_FIXTURE.scripts.locking);
    compiled.querySelector<HTMLButtonElement>('[aria-label="Close object display"]')!.click();
    fixture.detectChanges();

    const assemble = [...compiled.querySelectorAll('button')].find((button: HTMLButtonElement) =>
      button.textContent?.includes('Assemble execution'),
    ) as HTMLButtonElement;
    assemble.click();
    fixture.detectChanges();
    expect(compiled.textContent).not.toContain('Prepare this input for execution');
    expect(
      compiled.querySelector('[aria-label="Transaction relationship for script execution"]'),
    ).not.toBeNull();
    expect(compiled.textContent).toContain('Spending transaction');
    expect(compiled.textContent).toContain('Selected TxIn 0');
    expect(compiled.textContent).toContain('spends');
    expect(compiled.textContent).toContain('Previous transaction');
    expect(compiled.textContent).toContain('Referenced TxOut 1');
    expect(compiled.textContent).toContain(
      'This TxIn’s scriptSig unlocks the referenced TxOut’s scriptPubKey.',
    );
    expect(compiled.textContent).toContain(
      TRACE_RESPONSE_FIXTURE.sources.script_sig.transaction_txid,
    );
    expect(compiled.textContent).toContain(
      TRACE_RESPONSE_FIXTURE.sources.script_pubkey.transaction_txid,
    );
    expect(compiled.textContent).toContain(TRACE_RESPONSE_FIXTURE.scripts.locking);
    expect(compiled.textContent).toContain('Stack flow');
    expect(compiled.textContent).toContain('scriptSig');
    expect(compiled.textContent).toContain('scriptPubKey');
    expect(compiled.textContent).not.toContain('source:');
    expect(compiled.textContent).toContain('OP_1');
    expect(compiled.textContent).toContain('DATA (Signature)');
    expect(compiled.textContent).toContain('Original hex');
    expect(compiled.textContent).toContain('0x51');
    expect(compiled.textContent).toContain('OP_ADD');
    expect(compiled.textContent).toContain('Step 0 of 6');
    expect(compiled.textContent).toContain('Ready');
    expect(compiled.textContent).toContain('Empty stack');
    expect(compiled.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('0');
    expect(control('Restart trace').disabled).toBe(true);
    expect(control('Previous step').disabled).toBe(true);
    expect(control('Next step').disabled).toBe(false);
  });

  it('moves forward, backward, jumps to the result, and resets', () => {
    prepareExecution();
    expect(fixture.nativeElement.textContent).toContain('Ready');
    expect(fixture.nativeElement.textContent).not.toContain('Valid spend');

    control('Next step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 6');
    expect(fixture.nativeElement.textContent).toContain('Now running OP_1');
    expect(fixture.nativeElement.textContent).toContain('The stack is unchanged.');
    expect(fixture.nativeElement.textContent).toContain('Empty stack');
    expect(
      fixture.nativeElement.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'),
    ).toBe('17');

    control('Next step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 2 of 6');
    expect(fixture.nativeElement.textContent).toContain('Now running STACK PUSH');
    expect(fixture.nativeElement.textContent).toContain('DATA (True)');

    control('Previous step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 6');

    control('Go to result').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 6 of 6');
    expect(fixture.nativeElement.textContent).toContain('Now running STACK VALIDATION');
    expect(fixture.nativeElement.textContent).toContain('final stack value is true');
    expect(fixture.nativeElement.textContent).toContain('Valid spend');

    control('Restart trace').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 6');
    expect(fixture.nativeElement.textContent).toContain('Ready');
  });

  it('shows witness and derived scriptCode as the SegWit execution context', () => {
    fixture.componentRef.setInput('trace', P2WPKH_TRACE_RESPONSE_FIXTURE.trace);
    fixture.componentRef.setInput('scripts', {
      unlocking: '',
      locking: P2WPKH_TRACE_RESPONSE_FIXTURE.scripts.script_code,
      combined: P2WPKH_TRACE_RESPONSE_FIXTURE.scripts.script_code,
    });
    fixture.componentRef.setInput('sources', {
      script_sig: P2WPKH_TRACE_RESPONSE_FIXTURE.sources.witness,
      script_pubkey: P2WPKH_TRACE_RESPONSE_FIXTURE.sources.script_pubkey,
    });
    fixture.componentRef.setInput('scriptType', 'P2WPKH');
    fixture.componentRef.setInput('witnessItems', P2WPKH_TRACE_RESPONSE_FIXTURE.scripts.witness);
    fixture.componentRef.setInput('inputSequence', '4294967295');
    fixture.componentRef.setInput('spentOutputAmountSats', 42);
    fixture.componentRef.setInput(
      'spentOutputScriptPubKey',
      P2WPKH_TRACE_RESPONSE_FIXTURE.scripts.locking,
    );
    fixture.detectChanges();

    const findOutput = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Find spent output'),
    ) as HTMLButtonElement;
    findOutput.click();
    fixture.detectChanges();

    const inputReference = fixture.nativeElement.querySelector(
      '[aria-label="Open selected input 0 in the spending transaction"]',
    ) as HTMLButtonElement;
    inputReference.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.textContent).toContain(
      'Witness stack',
    );
    fixture.nativeElement.querySelector('[aria-label="Close object display"]').click();
    fixture.detectChanges();

    const outputReference = fixture.nativeElement.querySelector(
      '[aria-label="Open referenced output 2 in the previous transaction"]',
    ) as HTMLButtonElement;
    outputReference.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.textContent).toContain(
      P2WPKH_TRACE_RESPONSE_FIXTURE.scripts.locking,
    );
    fixture.nativeElement.querySelector('[aria-label="Close object display"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('final');

    const assemble = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Assemble execution'),
    ) as HTMLButtonElement;
    assemble.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('witness');
    expect(fixture.nativeElement.textContent).toContain('initializes stack');
    expect(fixture.nativeElement.textContent).toContain('P2PKH scriptCode');
    expect(fixture.nativeElement.textContent).not.toContain('scriptSig runs first');
    expect(fixture.nativeElement.textContent).toContain(
      'This TxIn’s witness satisfies the locking condition committed by the referenced TxOut’s scriptPubKey.',
    );
  });

  it('plays to the final step and pauses automatically', () => {
    prepareExecution();
    vi.useFakeTimers();
    const play = [...fixture.nativeElement.querySelectorAll('.vcr button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Play'),
    ) as HTMLButtonElement;
    play.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pause');

    vi.advanceTimersByTime(5_000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 6 of 6');
    expect(fixture.nativeElement.textContent).toContain('Play');
    expect(control('Next step').disabled).toBe(true);
  });

  it('supports arrow, space, Home, and End keyboard controls', () => {
    prepareExecution();
    const player = fixture.nativeElement.querySelector('.player') as HTMLElement;
    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 6');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 2 of 6');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 6');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pause');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 6 of 6');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 6');
    expect(control('Restart trace').getAttribute('aria-keyshortcuts')).toBe('Home');
    expect(control('Go to result').getAttribute('aria-keyshortcuts')).toBe('End');
  });

  it('shows the current stack workbench and per-operation movement', () => {
    prepareExecution();
    control('Go to result').click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const execution = compiled.querySelector<HTMLElement>('.execution-pane')!;
    const stack = compiled.querySelector<HTMLElement>('app-stack-workbench')!;
    expect(
      execution.compareDocumentPosition(stack) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(execution.querySelector('[aria-label="Stack movement"]')).not.toBeNull();
    expect(stack.querySelector('[aria-label="Stack movement"]')).toBeNull();
    expect(compiled.textContent).toContain('Execution');
    expect(compiled.textContent).toContain('Stack state');
    expect(compiled.textContent).toContain('after OP_ADD');
    expect(compiled.textContent).toContain('Main stack');
    expect(compiled.textContent).not.toContain('Alt stack');
    expect(compiled.textContent).toContain('Now running STACK VALIDATION');
    expect(execution.textContent).toContain('Consumednone');
    expect(execution.textContent).toContain('Producednone');

    control('Previous step').click();
    fixture.detectChanges();
    expect(execution.querySelectorAll('.movement-pill--out')).toHaveLength(2);
    expect(execution.querySelectorAll('.movement-pill--in')).toHaveLength(1);
  });

  it('opens the signature workspace from OP_CHECKSIG', () => {
    prepareExecution();
    fixture.componentRef.setInput('trace', {
      ...TRACE_FIXTURE,
      steps: TRACE_FIXTURE.steps.map((step, index) =>
        index === 2
          ? {
              ...step,
              opcode: { ...step.opcode, name: 'OP_CHECKSIG' },
              stacks: {
                ...step.stacks,
                before: {
                  ...step.stacks.before,
                  main: { depth: 2, items: ['02publickey', '30signature'] },
                },
              },
            }
          : step,
      ),
    });
    fixture.detectChanges();

    let signatureWorkspaceOpened = false;
    fixture.componentInstance.openSignatureWorkspace.subscribe(() => {
      signatureWorkspaceOpened = true;
    });

    control('Go to result').click();
    fixture.detectChanges();
    control('Previous step').click();
    fixture.detectChanges();

    const open = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Open signature walkthrough'),
    ) as HTMLButtonElement;
    open.click();
    fixture.detectChanges();
    expect(signatureWorkspaceOpened).toBe(true);
  });

  it('opens opcode information without advancing the walkthrough', () => {
    prepareExecution();
    fixture.componentRef.setInput('trace', {
      ...TRACE_FIXTURE,
      steps: TRACE_FIXTURE.steps.map((step, index) =>
        index === 1
          ? { ...step, opcode: { ...step.opcode, name: 'OP_DUP', is_push: false } }
          : step,
      ),
    });
    fixture.detectChanges();

    const opcode = [...fixture.nativeElement.querySelectorAll('.operation-list button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('OP_DUP'),
    ) as HTMLButtonElement;
    opcode.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('OP_CODE');
    expect(dialog.textContent).toContain('Copy the top stack item');
    expect(dialog.textContent).toContain('Stack effect');
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 4');
    expect(fixture.nativeElement.textContent).toContain('Empty stack');
  });

  it('explains each push as an opcode without advancing', () => {
    prepareExecution();
    const pushOpcode = [...fixture.nativeElement.querySelectorAll('.operation-list button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('OP_1'),
    ) as HTMLButtonElement;
    pushOpcode.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('OP_CODE');
    expect(dialog.textContent).toContain('OP_1');
    expect(dialog.textContent).toContain('0x51');
    expect(dialog.textContent).toContain('Purpose');
    expect(dialog.textContent).toContain('Push the Script number 1 onto the main stack.');
    expect(dialog.textContent).toContain('Stack effect');
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 6');
  });

  it('explains pushed signature data without advancing', () => {
    prepareExecution();
    fixture.componentRef.setInput('trace', {
      ...TRACE_FIXTURE,
      steps: TRACE_FIXTURE.steps.map((step, index) =>
        index === 0
          ? {
              ...step,
              opcode: {
                ...step.opcode,
                is_push: true,
                push_data: '0123456789abcdef',
              },
            }
          : step,
      ),
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('0123…cdef');
    const signatureData = fixture.nativeElement.querySelector(
      '[aria-label="DATA (Signature), 8 bytes"]',
    ) as HTMLButtonElement;
    signatureData.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('DATA');
    expect(dialog.textContent).toContain('DATA (Signature)');
    expect(dialog.textContent).toContain('0123456789abcdef');
    expect(dialog.textContent).toContain('DER-encoded ECDSA signature');
    expect(dialog.textContent).toContain('places this signature onto the empty stack');
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 5');
  });

  it('opens a concise data detail for a stack item', () => {
    prepareExecution();
    control('Next step').click();
    control('Next step').click();
    fixture.detectChanges();

    const stackItem = fixture.nativeElement.querySelector(
      '[aria-label="DATA (True), 1 of stack"]',
    ) as HTMLButtonElement;
    stackItem.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('STACK ITEM');
    expect(dialog.textContent).toContain('DATA (True)');
    expect(dialog.textContent).toContain('Stack position');
    expect(dialog.textContent).toContain('1');
    expect(dialog.textContent).toContain('Hex');
    expect(dialog.textContent).toContain('01');
  });

  it('explains the safe diagnostic for a failed trace', () => {
    prepareExecution();
    fixture.componentRef.setInput('trace', {
      ...TRACE_FIXTURE,
      success: false,
      diagnostic: {
        code: 'false-final-value',
        message: 'The final stack value is false.',
        step_index: 2,
        opcode_name: 'OP_ADD',
      },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ready');
    expect(fixture.nativeElement.textContent).not.toContain('Why execution failed');
    control('Next step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('In progress');
    expect(fixture.nativeElement.textContent).not.toContain('The final stack value is false.');

    control('Go to result').click();
    fixture.detectChanges();

    const explanation = fixture.nativeElement.querySelector(
      '[aria-label="Failure explanation"]',
    ) as HTMLElement;
    expect(explanation.textContent).toContain('Why execution failed');
    expect(explanation.textContent).toContain('The final stack value is false.');
    expect(explanation.textContent).toContain('false-final-value');
  });
});
