import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Bitcoin Math Lab — See Bitcoin execute',
    loadComponent: () => import('./pages/home/home').then((page) => page.Home),
  },
  {
    path: 'labs/script-visualizer',
    title: 'Script Visualizer — Bitcoin Math Lab',
    loadComponent: () =>
      import('./pages/script-visualizer/script-visualizer').then((page) => page.ScriptVisualizer),
  },
  {
    path: 'about',
    title: 'About — Bitcoin Math Lab',
    loadComponent: () => import('./pages/about/about').then((page) => page.About),
  },
  {
    path: 'docs',
    title: 'Documentation — Bitcoin Math Lab',
    loadComponent: () => import('./pages/docs/docs').then((page) => page.Docs),
  },
  {
    path: 'roadmap',
    title: 'Roadmap — Bitcoin Math Lab',
    loadComponent: () => import('./pages/roadmap/roadmap').then((page) => page.Roadmap),
  },
  {
    path: 'blog',
    title: 'Blog — Bitcoin Math Lab',
    loadComponent: () => import('./pages/blog/blog').then((page) => page.Blog),
  },
  {
    path: 'contact',
    title: 'Contact — Bitcoin Math Lab',
    loadComponent: () => import('./pages/contact/contact').then((page) => page.Contact),
  },
  {
    path: '**',
    title: 'Page not found — Bitcoin Math Lab',
    loadComponent: () => import('./pages/not-found/not-found').then((page) => page.NotFound),
  },
];
