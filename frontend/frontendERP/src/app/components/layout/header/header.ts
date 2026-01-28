import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { AuthService } from '../../../services/auth';
import { StockService, StockState } from '../../../services/stock';
import { VentesService } from '../../../services/ventes';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoginResponse } from '../../../api/models/login-response';

interface HeaderMetrics {
  activeChariots: number;
  totalStock: number;
  ventesCount: number;
}

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  readonly today = new Date();
  readonly user$: Observable<LoginResponse | null>;
  readonly metrics$: Observable<HeaderMetrics>;
  private sectionSubject: BehaviorSubject<string>;
  readonly currentSection$: Observable<string>;

  constructor(
    private authService: AuthService,
    private stockService: StockService,
    private ventesService: VentesService,
    private router: Router,
  ) {
    this.user$ = this.authService.currentUser$;
    this.metrics$ = combineLatest([
      this.stockService.state$,
      this.ventesService.ventesAuVendeur$,
      this.ventesService.ventesDuVendeur$,
    ]).pipe(
      map(([stock, ventesAu, ventesDu]) => this.computeMetrics(stock, ventesAu?.length ?? 0, ventesDu?.length ?? 0)),
    );

    this.sectionSubject = new BehaviorSubject<string>(this.deriveSection(this.router.url));
    this.currentSection$ = this.sectionSubject.asObservable();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.sectionSubject.next(this.deriveSection(event.urlAfterRedirects));
      });
  }

  logout() {
    this.authService.logout();
  }

  getPrimaryRole(user: LoginResponse | null): string {
    return user?.roles?.[0] ?? 'Utilisateur';
  }

  getInitials(user: LoginResponse | null): string {
    const role = this.getPrimaryRole(user);
    return role.slice(0, 2).toUpperCase();
  }

  private computeMetrics(stock: StockState, ventesAuCount: number, ventesDuCount: number): HeaderMetrics {
    const totalStock = Object.values(stock.raw || {}).reduce((sum, qty) => sum + (qty || 0), 0);
    return {
      activeChariots: stock.chariots?.length || 0,
      totalStock,
      ventesCount: ventesAuCount + ventesDuCount,
    };
  }

  private deriveSection(url: string): string {
    if (!url) {
      return 'Tableau de bord';
    }

    if (url.includes('industrial')) return 'Production industrielle';
    if (url.includes('commercial')) return 'Commercial & conditionnement';
    if (url.includes('emballage')) return 'Logistique emballage';
    if (url.includes('ventes')) return 'Ventes';
    if (url.includes('dashboard/stock-brut')) return 'Stock brut';
    if (url.includes('dashboard')) return 'Tableau de bord';
    return 'Espace de gestion';
  }
}
