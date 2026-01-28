import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS, withFetch } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { JwtInterceptor } from './services/interceptors/jwt';
import { Auth } from './components/auth/auth';
import { environment } from '../environments/environment';
import { provideApiConfiguration } from './api/api-configuration';
import { SidebarComponent } from './components/layout/sidebar/sidebar';
import { HeaderComponent } from './components/layout/header/header';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { StockBrut } from './components/stock-brut/stock-brut';
import { Industrial } from './components/industrial/industrial';
import { Commercial } from './components/commercial/commercial';
import { Emballage } from './components/emballage/emballage';
import { Ventes } from './components/ventes/ventes';

@NgModule({
  declarations: [
    App,
    Auth,
    SidebarComponent,
    HeaderComponent,
    MainLayoutComponent,
    DashboardComponent,
    StockBrut,
    Industrial,
    Commercial,
    Emballage,
    Ventes
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    provideApiConfiguration(environment.apiBaseUrl)
  ],
  bootstrap: [App]
})
export class AppModule { }



