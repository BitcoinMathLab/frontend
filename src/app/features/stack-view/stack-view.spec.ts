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
});
