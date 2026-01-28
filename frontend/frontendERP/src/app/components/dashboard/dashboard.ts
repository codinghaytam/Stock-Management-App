import { Component, OnInit } from '@angular/core';
import { StockService, StockState } from '../../services/stock';
import { VentesService } from '../../services/ventes';
import { Observable, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  
  stockState$: Observable<StockState>;
  stockDistribution$: Observable<StockDistribution>;
  
  totalRaw$: Observable<number>;
  activeChariots$: Observable<number>;
  recentSalesCount$: Observable<number>;
  totalSalesValue$: Observable<number>;
  boxesPackaged$: Observable<number>;
  recentSales$: Observable<DashboardSaleRow[]>;

  constructor(
    private stockService: StockService,
    private ventesService: VentesService
  ) {
    this.stockState$ = this.stockService.state$;

    this.stockDistribution$ = this.stockState$.pipe(
      map((state) => this.computeStockDistribution(state))
    );

    this.totalRaw$ = this.stockState$.pipe(
      map(state => {
        const r = state.raw;
        return (r?.ZITBLAD || 0) + (r?.ASSELIA || 0) + (r?.kAULDA || 0);
      })
    );
    
    this.activeChariots$ = this.stockState$.pipe(
      map(state => state.chariots?.length || 0)
    );

    this.boxesPackaged$ = this.stockState$.pipe(
        map(state => state.summary?.boitesEmballees || 0)
    );

    this.recentSalesCount$ = combineLatest([
      this.ventesService.ventesAuVendeur$,
      this.ventesService.ventesDuVendeur$,
    ]).pipe(
      map(([au, du]) => (au?.length || 0) + (du?.length || 0))
    );

    this.totalSalesValue$ = combineLatest([
      this.ventesService.ventesAuVendeur$,
      this.ventesService.ventesDuVendeur$,
    ]).pipe(
      map(([au, du]) =>
        [...(au || []), ...(du || [])].reduce((acc, v) => acc + (v.montantTotal || 0), 0)
      )
    );

    this.recentSales$ = combineLatest([
      this.ventesService.ventesAuVendeur$,
      this.ventesService.ventesDuVendeur$,
    ]).pipe(
      map(([au, du]) => this.buildRecentSales(au || [], du || []))
    );
  }

  ngOnInit() {
    this.stockService.refreshStock();
    this.ventesService.refreshVentesAuVendeur();
    this.ventesService.refreshVentesDuVendeur();
  }

  private computeStockDistribution(state: StockState): StockDistribution {
    const raw = state.raw || {};
    const total = (raw.ZITBLAD || 0) + (raw.ASSELIA || 0) + (raw.kAULDA || 0);
    const safeTotal = total || 1;
    return {
      total,
      zitblad: raw.ZITBLAD || 0,
      asselia: raw.ASSELIA || 0,
      kaulda: raw.kAULDA || 0,
      zitbladPct: total ? Math.round(((raw.ZITBLAD || 0) / safeTotal) * 100) : 0,
      asseliaPct: total ? Math.round(((raw.ASSELIA || 0) / safeTotal) * 100) : 0,
      kauldaPct: total ? Math.round(((raw.kAULDA || 0) / safeTotal) * 100) : 0,
    };
  }

  private buildRecentSales(au: Array<{ id?: string; dateVente?: string; vendeurId?: string; montantTotal?: number }>, du: Array<{ id?: string; dateVente?: string; vendeurId?: string; montantTotal?: number }>): DashboardSaleRow[] {
    const rows: DashboardSaleRow[] = [
      ...au.map((vente): DashboardSaleRow => ({
        id: vente.id || '',
        date: vente.dateVente || null,
        type: 'AU_VENDEUR',
        vendeurId: vente.vendeurId || '',
        amount: vente.montantTotal || 0,
      })),
      ...du.map((vente): DashboardSaleRow => ({
        id: vente.id || '',
        date: vente.dateVente || null,
        type: 'DU_VENDEUR',
        vendeurId: vente.vendeurId || '',
        amount: vente.montantTotal || 0,
      })),
    ];

    return rows
      .sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 4);
  }
}

interface DashboardSaleRow {
  id: string;
  date: string | null;
  type: 'AU_VENDEUR' | 'DU_VENDEUR';
  vendeurId: string;
  amount: number;
}

interface StockDistribution {
  total: number;
  zitblad: number;
  asselia: number;
  kaulda: number;
  zitbladPct: number;
  asseliaPct: number;
  kauldaPct: number;
}
