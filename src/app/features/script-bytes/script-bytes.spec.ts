import { TestBed } from '@angular/core/testing';

import { ScriptBytes } from './script-bytes';

describe('ScriptBytes', () => {
  it('highlights every byte in the active instruction range', async () => {
    await TestBed.configureTestingModule({ imports: [ScriptBytes] }).compileComponents();
    const fixture = TestBed.createComponent(ScriptBytes);
    fixture.componentRef.setInput('script', '4c02010293');
    fixture.componentRef.setInput('activeOffset', 0);
    fixture.componentRef.setInput('activeLength', 4);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('code')).toHaveLength(5);
    expect(fixture.nativeElement.querySelectorAll('.bytes__active')).toHaveLength(4);
    expect(fixture.nativeElement.textContent).toContain('5 bytes');
  });
});
