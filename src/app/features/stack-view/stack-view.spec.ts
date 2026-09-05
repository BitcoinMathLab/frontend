import { TestBed } from '@angular/core/testing';

import { StackView } from './stack-view';

describe('StackView', () => {
  it('renders stack values top-first so additions extend the stack downward', async () => {
    await TestBed.configureTestingModule({ imports: [StackView] }).compileComponents();
    const fixture = TestBed.createComponent(StackView);
    fixture.componentRef.setInput('label', 'Main stack after');
    fixture.componentRef.setInput('snapshot', { depth: 2, items: ['02', '01'] });
    fixture.componentRef.setInput('stepIndex', 1);
    fixture.detectChanges();

    const values = [...fixture.nativeElement.querySelectorAll('code')].map(
      (element: Element) => element.textContent,
    );
    expect(values).toEqual(['DATA (1 byte)', '02', 'DATA (True)', '01']);
    expect(
      fixture.nativeElement.querySelector('[aria-label="DATA (1 byte), 1 (Top) of stack"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('2 items');
    expect(fixture.nativeElement.textContent).toContain('True');
  });

  it('announces an empty stack', async () => {
    await TestBed.configureTestingModule({ imports: [StackView] }).compileComponents();
    const fixture = TestBed.createComponent(StackView);
    fixture.componentRef.setInput('label', 'Alt stack before');
    fixture.componentRef.setInput('snapshot', { depth: 0, items: [] });
    fixture.componentRef.setInput('stepIndex', 0);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Empty stack');
  });

  it('uses one-based positions and labels only the ends of multi-item stacks', async () => {
    await TestBed.configureTestingModule({ imports: [StackView] }).compileComponents();
    const fixture = TestBed.createComponent(StackView);
    fixture.componentRef.setInput('label', 'Main stack');
    fixture.componentRef.setInput('snapshot', { depth: 3, items: ['01', '02', '03'] });
    fixture.componentRef.setInput('stepIndex', 0);
    fixture.detectChanges();

    const labels = [
      ...(fixture.nativeElement.querySelectorAll('.stack-item') as NodeListOf<HTMLButtonElement>),
    ].map((item) => item.getAttribute('aria-label'));
    expect(labels).toEqual([
      'DATA (True), 1 (Top) of stack',
      'DATA (1 byte), 2 of stack',
      'DATA (1 byte), 3 (Bottom) of stack',
    ]);

    fixture.componentRef.setInput('snapshot', { depth: 1, items: ['01'] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stack-item')?.getAttribute('aria-label')).toBe(
      'DATA (True), 1 of stack',
    );
  });

  it('gives recognizable Bitcoin values distinct semantic treatments', async () => {
    await TestBed.configureTestingModule({ imports: [StackView] }).compileComponents();
    const fixture = TestBed.createComponent(StackView);
    fixture.componentRef.setInput('label', 'Main stack');
    fixture.componentRef.setInput('snapshot', {
      depth: 4,
      items: [`30${'11'.repeat(8)}`, `02${'22'.repeat(32)}`, '33'.repeat(20), '01'],
    });
    fixture.componentRef.setInput('stepIndex', 2);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.stack-item.signature')).not.toBeNull();
    expect(compiled.querySelector('.stack-item.pubkey')).not.toBeNull();
    expect(compiled.querySelector('.stack-item.hash')).not.toBeNull();
    expect(compiled.querySelector('.stack-item.boolean')).not.toBeNull();
  });

  it('keeps six items fixed in the stack and returns focus after inspecting overflow', async () => {
    await TestBed.configureTestingModule({ imports: [StackView] }).compileComponents();
    const fixture = TestBed.createComponent(StackView);
    fixture.componentRef.setInput('label', 'Main stack after OP_8');
    fixture.componentRef.setInput('snapshot', {
      depth: 8,
      items: ['08', '07', '06', '05', '04', '03', '02', '01'],
    });
    fixture.componentRef.setInput('stepIndex', 7);
    fixture.detectChanges();

    const overflow = fixture.nativeElement.querySelector('.stack-overflow') as HTMLButtonElement;
    expect(fixture.nativeElement.querySelectorAll('.stack-view__items .stack-item')).toHaveLength(
      6,
    );
    expect(overflow.textContent).toContain('Inspect 2 more items');
    overflow.focus();
    overflow.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const close = fixture.nativeElement.querySelector(
      '[aria-label="Close all stack items"]',
    ) as HTMLButtonElement;
    expect(dialog).not.toBeNull();
    expect(dialog.querySelectorAll(':scope > div > button')).toHaveLength(8);
    expect(fixture.nativeElement.querySelectorAll('.stack-view__items .stack-item')).toHaveLength(
      6,
    );
    expect(close).toBe(document.activeElement);

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await Promise.resolve();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(overflow).toBe(document.activeElement);
  });
});
