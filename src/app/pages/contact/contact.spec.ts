import { TestBed } from '@angular/core/testing';

import { Contact } from './contact';

describe('Contact', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Contact] }).compileComponents();
  });

  it('provides direct contact and private vulnerability-reporting paths', () => {
    const fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('a[href="mailto:bitcoinmathlab@gmail.com"]')).toBeTruthy();
    expect(
      compiled.querySelector(
        'a[href="https://github.com/BitcoinMathLab/bitclone/security/policy"]',
      ),
    ).toBeTruthy();
    expect(compiled.textContent).not.toContain('relevant repository');
  });
});
