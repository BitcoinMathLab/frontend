import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected readonly navigation = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Visualizer', path: '/labs/script-visualizer', exact: false },
    { label: 'Explorer', path: '/labs/transaction-explorer', exact: false },
    { label: 'About', path: '/about', exact: false },
    { label: 'Docs', path: '/docs', exact: false },
    { label: 'Roadmap', path: '/roadmap', exact: false },
    { label: 'Blog', path: '/blog', exact: false },
    { label: 'Contact', path: '/contact', exact: false },
  ];
}
