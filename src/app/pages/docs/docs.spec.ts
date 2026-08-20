import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Docs } from './docs';

describe('Docs', () => {
  let fixture: ComponentFixture<Docs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Docs],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Docs);
    fixture.detectChanges();
  });

  it('publishes the architecture, scope, principles, and FAQ', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#architecture')).toBeTruthy();
    expect(compiled.querySelector('#principles')).toBeTruthy();
    expect(compiled.querySelector('#scope')).toBeTruthy();
    expect(compiled.querySelectorAll('#faq details')).toHaveLength(5);
    expect(compiled.textContent).toContain('Three repositories, explicit responsibilities.');
    expect(compiled.textContent).toContain('Bitcoin Core remains the production source of truth');
  });
});
