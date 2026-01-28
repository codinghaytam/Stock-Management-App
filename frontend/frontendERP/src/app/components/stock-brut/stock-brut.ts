import { Component } from '@angular/core';
import { StockService, StockState } from '../../services/stock';
import { Api } from '../../api/api';
import { stockBrutAugmenter } from '../../api/fn/stock-brut/stock-brut-augmenter';
import { stockBrutDiminuer } from '../../api/fn/stock-brut/stock-brut-diminuer';
import { Type } from '../../api/models';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-stock-brut',
  standalone: false,
  templateUrl: './stock-brut.html',
  styleUrl: './stock-brut.css',
})
export class StockBrut {
  
  stockState$: Observable<StockState>;
  types: Type[] = ['ZITBLAD', 'ASSELIA', 'kAULDA'];
  kpi$: Observable<StockKpi>;
  inventoryRows$: Observable<InventoryRow[]>;
  showBulkModal = false;
  bulkType: Type = 'ZITBLAD';
  bulkQuantity = 1;
  readonly today = new Date();

  constructor(
    private stockService: StockService,
    private api: Api
  ) {
    this.stockState$ = this.stockService.state$;
    this.kpi$ = this.stockState$.pipe(map((state) => this.buildKpi(state)));
    this.inventoryRows$ = this.stockState$.pipe(map((state) => this.buildRows(state)));
  }

  openBulkModal(type?: Type) {
    this.bulkType = type ?? this.bulkType;
    this.bulkQuantity = 1;
    this.showBulkModal = true;
  }

  closeBulkModal() {
    this.showBulkModal = false;
  }

  augmenter(type: Type, quantite = 1) {
    this.api.invoke(stockBrutAugmenter, { body: { type, quantite } }).then(() => {
        // Webhook will trigger refresh
    });
  }

  diminuer(type: Type, quantite = 1) {
    this.api.invoke(stockBrutDiminuer, { body: { type, quantite } }).then(() => {
    });
  }

  applyBulkIncrease() {
    if (this.bulkQuantity <= 0) return;
    this.augmenter(this.bulkType, this.bulkQuantity);
    this.closeBulkModal();
  }

  applyBulkDecrease() {
    if (this.bulkQuantity <= 0) return;
    this.diminuer(this.bulkType, this.bulkQuantity);
    this.closeBulkModal();
  }

  private buildKpi(state: StockState): StockKpi {
    const rawTotal = Object.values(state.raw || {}).reduce((sum, qty) => sum + (qty || 0), 0);
    const packaged = state.summary?.boitesEmballees ?? 0;
    const packaging = state.chariots?.length ?? 0;
    return {
      rawTotal,
      packaged,
      packaging,
    };
  }

  private buildRows(state: StockState): InventoryRow[] {
    const raw = state.raw || {};
    const quantities = this.types.map((type) => raw[type] || 0);
    const maxQty = Math.max(...quantities, 0);
    return this.types.map((type) => {
      const qty = raw[type] || 0;
      const percent = maxQty ? Math.round((qty / maxQty) * 100) : 0;
      const status = this.resolveStatus(percent, qty);
      return {
        type,
        name: this.resolveName(type),
        sku: this.resolveSku(type),
        description: this.resolveDescription(type),
        unit: this.resolveUnit(type),
        quantity: qty,
        percent,
        status,
      };
    });
  }

  private resolveStatus(percent: number, qty: number): InventoryStatus {
    if (qty === 0) return { label: 'Critical', className: 'status-critical' };
    if (percent >= 60) return { label: 'In Stock', className: 'status-ok' };
    if (percent >= 30) return { label: 'Low Stock', className: 'status-low' };
    return { label: 'Critical', className: 'status-critical' };
  }

  private resolveName(type: Type): string {
    if (type === 'ZITBLAD') return 'ZITBLAD Extra Virgin';
    if (type === 'ASSELIA') return 'ASSELIA Virgin';
    return 'KAULDA Pomace';
  }

  private resolveDescription(type: Type): string {
    if (type === 'ZITBLAD') return 'Premium Selection';
    if (type === 'ASSELIA') return 'Standard Blend';
    return 'Refined Oil';
  }

  private resolveSku(type: Type): string {
    if (type === 'ZITBLAD') return 'ZB-EV-RAW';
    if (type === 'ASSELIA') return 'AS-VG-RAW';
    return 'KA-PO-RAW';
  }

  private resolveUnit(type: Type): string {
    if (type === 'kAULDA') return 'Liters';
    return 'Liters';
  }
}

interface StockKpi {
  rawTotal: number;
  packaged: number;
  packaging: number;
}

interface InventoryRow {
  type: Type;
  name: string;
  description: string;
  sku: string;
  unit: string;
  quantity: number;
  percent: number;
  status: InventoryStatus;
}

interface InventoryStatus {
  label: string;
  className: string;
}

