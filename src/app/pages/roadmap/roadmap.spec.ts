import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Roadmap } from './roadmap';

describe('Roadmap', () => {
  let fixture: ComponentFixture<Roadmap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Roadmap] }).compileComponents();
    fixture = TestBed.createComponent(Roadmap);
    fixture.detectChanges();
  });

  it('distinguishes completed implementation from operational work', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.timeline li.complete')).toHaveLength(3);
    expect(compiled.querySelectorAll('.timeline li.in-progress')).toHaveLength(2);
    expect(compiled.textContent).toContain('Trace engine');
    expect(compiled.textContent).toContain('Release candidate');
  });
});
