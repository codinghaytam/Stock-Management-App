import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Auth } from './components/auth/auth';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { StockBrut } from './components/stock-brut/stock-brut';
import { Industrial } from './components/industrial/industrial';
import { Commercial } from './components/commercial/commercial';
import { Emballage } from './components/emballage/emballage';
import { Ventes } from './components/ventes/ventes';

const routes: Routes = [
  { path: 'login', component: Auth },
  { 
    path: '', 
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'dashboard/stock-brut', component: StockBrut },
      { path: 'dashboard/industrial', component: Industrial },
      { path: 'dashboard/commercial', component: Commercial },
      { path: 'dashboard/emballage', component: Emballage },
      { path: 'dashboard/ventes', component: Ventes }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }


