import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignatureDetail } from './signature-detail';

describe('SignatureDetail', () => {
  let fixture: ComponentFixture<SignatureDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SignatureDetail] }).compileComponents();
    fixture = TestBed.createComponent(SignatureDetail);
    fixture.componentRef.setInput('signature', '30signature');
    fixture.componentRef.setInput('publicKey', '02publickey');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('focuses the dialog and exposes its values', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('How this signature is verified');
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
