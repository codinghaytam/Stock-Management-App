import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, from, forkJoin } from 'rxjs';
import { Api } from '../api/api';
import { stockBrutQuantite } from '../api/fn/stock-brut/stock-brut-quantite';
import { listerChariots } from '../api/fn/emballage/lister-chariots';
import { resumeEmballage } from '../api/fn/emballage/resume-emballage';
import { WebhookService, WebhookEventType } from './webhook';
import { Type } from '../api/models';
import { Logger } from './logger';

export interface StockState {
  raw: { [key in Type]?: number };
  chariots: any[]; 
  summary: any;
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private stateSubject = new BehaviorSubject<StockState>({
    raw: {},
    chariots: [],
    summary: null,
    loading: false
  });
  
  public state$ = this.stateSubject.asObservable();

  constructor(
    private api: Api,
    private webhookService: WebhookService,
    private logger: Logger,
  ) {
    this.init();
  }

  private init() {
    this.refreshStock();
    this.webhookService.events$.subscribe(event => {
      if (event === WebhookEventType.STOCK_CHANGED) {
        this.refreshStock();
      }
    });
  }

  public refreshStock() {
    this.setLoading(true);

    const types: Type[] = ['ZITBLAD', 'ASSELIA', 'kAULDA'];
    
    // Convert Promises to Observables
    const stockRequests = types.map(t => from(this.api.invoke(stockBrutQuantite, { type: t })));
    const chariotsRequest = from(this.api.invoke(listerChariots, {}));
    const summaryRequest = from(this.api.invoke(resumeEmballage, {}));

    forkJoin([
      ...stockRequests,
      chariotsRequest,
      summaryRequest
    ]).subscribe({
      next: (results) => {
        // results indices: 0,1,2 are stocks. 3 is chariots. 4 is summary.
        const rawStock: { [key in Type]?: number } = {};
        
        // Stock results are objects { quantite, type }
        // We know the order matches 'types' array
        
        const r0 = results[0] as any; // StockQuantiteResponse
        const r1 = results[1] as any;
        const r2 = results[2] as any;

        if (r0) rawStock[r0.type as Type] = r0.quantite;
        if (r1) rawStock[r1.type as Type] = r1.quantite;
        if (r2) rawStock[r2.type as Type] = r2.quantite;
        
        const chariots = results[3] as any[];
        const summary = results[4];

        this.updateState({
          raw: rawStock,
          chariots: chariots,
          summary: summary,
          loading: false
        });
      },
      error: (err) => {
        this.logger.error('Failed to refresh stock', { types }, err);
        this.setLoading(false);
      }
    });

  }

  private setLoading(loading: boolean) {
    this.stateSubject.next({ ...this.stateSubject.value, loading });
  }

  private updateState(newState: Partial<StockState>) {
    this.stateSubject.next({ ...this.stateSubject.value, ...newState });
  }
}


