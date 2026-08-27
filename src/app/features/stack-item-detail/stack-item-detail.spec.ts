import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StackItemDetail } from './stack-item-detail';

describe('StackItemDetail', () => {
  let fixture: ComponentFixture<StackItemDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StackItemDetail] }).compileComponents();
    fixture = TestBed.createComponent(StackItemDetail);
    fixture.componentRef.setInput('detail', {
      position: '1 (Top)',
      name: 'Signature',
      hex: '30signature',
    });
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('shows the data type once and focuses the modal', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('DATA (Signature)');
    expect(dialog.textContent).not.toContain('Data type');
    expect(dialog.textContent).toContain('1 (Top)');
    expect(dialog.textContent).toContain('30signature');
    expect(document.activeElement).toBe(dialog);
  });

  it('requests close with Escape', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(close).toHaveBeenCalledOnce();
  });
});
