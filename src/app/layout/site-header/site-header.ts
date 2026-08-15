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
    { label: 'About', path: '/about', exact: false },
    { label: 'Roadmap', path: '/roadmap', exact: false },
    { label: 'Blog', path: '/blog', exact: false },
    { label: 'Contact', path: '/contact', exact: false },
  ];
}
