import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabsPage } from './tabs.page';

/**
 * Configuración de Rutas para los Tabs
 * 
 * Esta configuración crea una estructura de navegación con tabs
 * donde cada tab carga su página correspondiente.
 * 
 * El path '' (vacío) redirige automáticamente al dashboard
 */
const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../pages/dashboard/dashboard.module').then(m => m.DashboardPageModule)
      },
      {
        path: 'transactions',
        loadChildren: () => import('../pages/transactions/transactions.module').then(m => m.TransactionsPageModule)
      },
      {
        path: 'goals',
        loadChildren: () => import('../pages/goals/goals.module').then(m => m.GoalsPageModule)
      },
      {
        path: 'tips',
        loadChildren: () => import('../pages/tips/tips.module').then(m => m.TipsPageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('../pages/settings/settings.module').then(m => m.SettingsPageModule)
      },
      {
        path: 'user-profile',
        loadChildren: () => import('../pages/user-profile/user-profile.module').then(m => m.UserProfilePageModule)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
