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
    path: 'display/block/:hash',
    title: 'Block Display — Bitcoin Math Lab',
    data: { objectKind: 'block' },
    loadComponent: () => import('./pages/display/display').then((page) => page.Display),
  },
  {
    path: 'display/transaction/:txid/input/:index',
    title: 'Transaction Input Display — Bitcoin Math Lab',
    data: { objectKind: 'tx-input' },
    loadComponent: () => import('./pages/display/display').then((page) => page.Display),
  },
  {
    path: 'display/transaction/:txid/output/:index',
    title: 'Transaction Output Display — Bitcoin Math Lab',
    data: { objectKind: 'tx-output' },
    loadComponent: () => import('./pages/display/display').then((page) => page.Display),
  },
  {
    path: 'display/transaction/:txid',
    title: 'Transaction Display — Bitcoin Math Lab',
    data: { objectKind: 'transaction' },
    loadComponent: () => import('./pages/display/display').then((page) => page.Display),
  },
  {
    path: 'display',
    title: 'Bitcoin Object Display — Bitcoin Math Lab',
    loadComponent: () => import('./pages/display/display').then((page) => page.Display),
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
