import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Blog } from './blog';

describe('Blog', () => {
  let fixture: ComponentFixture<Blog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blog],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Blog);
    fixture.detectChanges();
  });

  it('links all four published articles', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.posts article')).toHaveLength(4);
    expect(compiled.querySelectorAll('.posts h2 a')).toHaveLength(4);
    expect(compiled.textContent).toContain('Why Bitcoin Math Lab?');
    expect(compiled.textContent).not.toContain('Coming soon');
  });
});
