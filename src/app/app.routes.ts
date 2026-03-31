import { Routes } from '@angular/router';
<<<<<<< HEAD
import { authGuard } from './core/guard/auth';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home').then((m) => m.HomeComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/user/user').then((m) => m.UserComponent),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./pages/groups/groups').then((m) => m.GroupsComponent),
      },
      { path: 'group-dashboard/:id', loadComponent: () => import('./pages/group-dashboard/group-dashboard').then(m => m.GroupDashboard) },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
=======

export const routes: Routes = [];
>>>>>>> 7f067b53a85d9531ed00284ac6bc5b5a2bc3c796
