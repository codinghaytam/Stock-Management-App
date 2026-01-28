import { Injectable } from '@angular/core';
import { Subject, interval, Subscription } from 'rxjs';
import { Logger } from './logger';

export enum WebhookEventType {
  STOCK_CHANGED = 'STOCK_CHANGED',
  VENTE_AU_VENDEUR_CREATED = 'VENTE_AU_VENDEUR_CREATED',
  VENTE_DU_VENDEUR_CREATED = 'VENTE_DU_VENDEUR_CREATED'
}

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  private eventSubject = new Subject<WebhookEventType>();
  public events$ = this.eventSubject.asObservable();
  
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 30000; // 30 seconds

  constructor(private logger: Logger) {
    this.startPolling();
  }

  // Simulator for receiving a webhook (or polling mechanism)
  private startPolling() {
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      // In a real app with a proxy, this would be triggered by an actual pushed event.
      // Here, we simulate "checking" or just trigger a refresh cycle.
      // We emit all relevant events to keep caches fresh in this polling fallback mode.
      
      this.logger.info('Webhook polling trigger', { events: ['stock', 'ventes'] });
      this.eventSubject.next(WebhookEventType.STOCK_CHANGED);
      this.eventSubject.next(WebhookEventType.VENTE_AU_VENDEUR_CREATED);
      this.eventSubject.next(WebhookEventType.VENTE_DU_VENDEUR_CREATED);
    });
  }

  // Method to manually trigger an event (e.g. after a successful mutation)
  // This helps with "Optimistic UI" updates or immediate refresh
  notifyEvent(type: WebhookEventType) {
    this.eventSubject.next(type);
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }
}

