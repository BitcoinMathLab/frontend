import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationDetail } from './operation-detail';

describe('OperationDetail', () => {
  let fixture: ComponentFixture<OperationDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OperationDetail] }).compileComponents();
    fixture = TestBed.createComponent(OperationDetail);
    fixture.componentRef.setInput('detail', {
      kind: 'Opcode',
      name: 'OP_DUP',
      summary: 'Copy the top stack item and push the duplicate.',
      requirement: 'Requires at least one stack item.',
    });
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('labels and focuses the modal content', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('OP_DUP');
    expect(dialog.getAttribute('aria-describedby')).toContain('operation-detail-summary');
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
