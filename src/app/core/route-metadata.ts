import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const SITE_ORIGIN = 'https://bitcoinmathlab.com';
const SOCIAL_IMAGE = `${SITE_ORIGIN}/assets/bitcoin-math-lab-social.png`;

export interface PageMetadata {
  readonly title: string;
  readonly description: string;
  readonly type: 'website' | 'article';
}

const STATIC_METADATA: Readonly<Record<string, PageMetadata>> = Object.freeze({
  '/': {
    title: 'Bitcoin Math Lab — See Bitcoin execute',
    description:
      'Trace Bitcoin scripts step by step, inspect stack transitions, and understand why execution succeeds or fails.',
    type: 'website',
  },
  '/visualizer': {
    title: 'Script Visualizer — Bitcoin Math Lab',
    description:
      'Step through valid and invalid P2PKH spends with synchronized opcodes, serialized bytes, and stack snapshots.',
    type: 'website',
  },
  '/explorer': {
    title: 'Transaction Explorer — Bitcoin Math Lab',
    description:
      'Load a Bitcoin transaction and inspect its raw bytes, inputs, and previous outputs through a local Bitcoin Core node.',
    type: 'website',
  },
  '/about': {
    title: 'About — Bitcoin Math Lab',
    description:
      'Learn why Bitcoin Math Lab makes scripts, transactions, and consensus decisions visible through inspectable software.',
    type: 'website',
  },
  '/contact': {
    title: 'Contact — Bitcoin Math Lab',
    description:
      'Contact Bitcoin Math Lab about the open-source project, educational tools, or early access.',
    type: 'website',
  },
});

const NOT_FOUND_METADATA: PageMetadata = {
  title: 'Page not found — Bitcoin Math Lab',
  description: 'The requested Bitcoin Math Lab page could not be found.',
  type: 'website',
};

export function metadataForPath(path: string): PageMetadata {
  const staticMetadata = STATIC_METADATA[path];
  if (staticMetadata) return staticMetadata;

  return NOT_FOUND_METADATA;
}

@Injectable({ providedIn: 'root' })
export class RouteMetadata {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.apply(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((event) => this.apply(event.urlAfterRedirects));
  }

  private apply(url: string): void {
    const path = url.split(/[?#]/, 1)[0] || '/';
    const metadata = metadataForPath(path);
    const canonicalUrl = `${SITE_ORIGIN}${path === '/' ? '/' : path}`;

    this.updateName('description', metadata.description);
    this.updateName('twitter:title', metadata.title);
    this.updateName('twitter:description', metadata.description);
    this.updateProperty('og:title', metadata.title);
    this.updateProperty('og:description', metadata.description);
    this.updateProperty('og:type', metadata.type);
    this.updateProperty('og:url', canonicalUrl);
    this.updateProperty('og:image', SOCIAL_IMAGE);

    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.append(canonical);
    }
    canonical.href = canonicalUrl;
  }

  private updateName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private updateProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }
}
