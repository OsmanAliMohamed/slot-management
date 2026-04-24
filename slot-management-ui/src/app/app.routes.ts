import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin.guard';

export const routes: Routes = [
  { path: 'login',    loadComponent: () => import('./auth/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./auth/register/register').then(m => m.Register) },
  {
    path: 'generate',
    canActivate: [adminGuard],
    loadComponent: () => import('./slots/slot-management-page/slot-management-page').then(m => m.SlotManagementPage)
  },
  {
    path: 'next-slots',
    canActivate: [authGuard],
    loadComponent: () => import('./slots/next-slots/next-slots').then(m => m.NextSlots)
  },
  {
    path: 'all-slots',
    canActivate: [authGuard],
    loadComponent: () => import('./slots/all-slots/all-slots').then(m => m.AllSlots)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./profile/profile').then(m => m.Profile)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin').then(m => m.Admin)
  },
  { path: '',     redirectTo: 'next-slots', pathMatch: 'full' },
  { path: '**',   redirectTo: 'login' }
];
