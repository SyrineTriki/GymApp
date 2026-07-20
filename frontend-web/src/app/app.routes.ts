import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { AdminDashboardComponent } from './components/admin/dashboard';
import { SuperAdminDashboardComponent } from './components/super-admin/dashboard';
import { authGuard, adminGuard, superAdminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'super-admin/dashboard',
    component: SuperAdminDashboardComponent,
    canActivate: [authGuard, superAdminGuard],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
