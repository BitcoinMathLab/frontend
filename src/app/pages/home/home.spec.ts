import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows the launch roadmap milestones', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const milestones = compiled.querySelectorAll('.roadmap-preview .feature-grid article');

    expect(milestones).toHaveLength(3);
    expect(compiled.textContent).toContain('October 12');
    expect(compiled.textContent).toContain('Integrated visualizer');
    expect(compiled.querySelector('a[routerlink="/visualizer"]')).toBeTruthy();
    expect(compiled.querySelector('a[routerlink="/roadmap"]')).toBeNull();
    expect(compiled.querySelector('a[routerlink^="/blog"]')).toBeNull();
  });

  it('provides a prefilled email signup action', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const signup = compiled.querySelector<HTMLAnchorElement>('.launch-signup__action a');

    expect(signup?.getAttribute('href')).toContain('mailto:bitcoinmathlab@gmail.com');
    expect(signup?.getAttribute('href')).toContain(
      'subject=Bitcoin%20Math%20Lab%20launch%20updates',
    );
    expect(signup?.getAttribute('href')).toContain('early-access%20list');
  });

  it('keeps the static trace preview neutral until the final step', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const preview = fixture.nativeElement.querySelector('.trace-card') as HTMLElement;

    expect(preview.textContent).toContain('Step 4 of 7');
    expect(preview.textContent).toContain('OP_HASH160');
    expect(preview.textContent).toContain('In progress');
    expect(preview.textContent).not.toContain('Valid');
    expect(preview.querySelectorAll('.timeline span')).toHaveLength(7);
  });
});
