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

  it('presents the product surface without limiting it to a P2PKH trace', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const preview = fixture.nativeElement.querySelector('.product-preview') as HTMLElement;

    expect(preview.textContent).toContain('Script Visualizer');
    expect(preview.textContent).toContain('Transaction Explorer');
    expect(preview.textContent).toContain('Signature Lab');
    expect(preview.textContent).toContain('Verified');
  });

  it('describes only the learning experience available in the MVP', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain(
      'Bitcoin Math Lab turns opaque transactions, scripts, and consensus rules',
    );
    expect(content).toContain('Inspect each rule');
    expect(content).toContain('Signature walkthrough');
    expect(content).not.toContain('make every Bitcoin transaction work');
    expect(content).not.toContain('guided lessons');
  });
});
