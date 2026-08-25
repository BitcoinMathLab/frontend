import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Bitcoin Math Lab — See Bitcoin execute',
    loadComponent: () => import('./pages/home/home').then((page) => page.Home),
  },
  {
    path: 'visualizer',
    title: 'Script Visualizer — Bitcoin Math Lab',
    loadComponent: () =>
      import('./pages/script-visualizer/script-visualizer').then((page) => page.ScriptVisualizer),
  },
  {
    path: 'explorer',
    title: 'Transaction Explorer — Bitcoin Math Lab',
    loadComponent: () =>
      import('./pages/transaction-explorer/transaction-explorer').then(
        (page) => page.TransactionExplorer,
      ),
  },
  {
    path: 'about',
    title: 'About — Bitcoin Math Lab',
    loadComponent: () => import('./pages/about/about').then((page) => page.About),
  },
  {
    path: 'labs/script-visualizer',
    redirectTo: 'visualizer',
    pathMatch: 'full',
  },
  {
    path: 'labs/transaction-explorer',
    redirectTo: 'explorer',
    pathMatch: 'full',
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
