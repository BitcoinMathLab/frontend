import { TestBed } from '@angular/core/testing';

import { StackView } from './stack-view';

describe('StackView', () => {
  it('renders stack values in top-first order', async () => {
    await TestBed.configureTestingModule({ imports: [StackView] }).compileComponents();
    const fixture = TestBed.createComponent(StackView);
    fixture.componentRef.setInput('label', 'Main stack after');
    fixture.componentRef.setInput('snapshot', { depth: 2, items: ['02', '01'] });
    fixture.componentRef.setInput('stepIndex', 1);
    fixture.detectChanges();

    const values = [...fixture.nativeElement.querySelectorAll('code')].map(
      (element: Element) => element.textContent,
    );
    expect(values).toEqual(['02', '01']);
    expect(fixture.nativeElement.textContent).toContain('Top');
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
});
