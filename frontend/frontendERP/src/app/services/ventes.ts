import { Injectable } from '@angular/core';
import { BehaviorSubject, from } from 'rxjs';
import { Api } from '../api/api';
import { listerVentes } from '../api/fn/ventes/lister-ventes';
import { WebhookService, WebhookEventType } from './webhook';
import { VenteAuVendeur, VenteDuVendeur } from '../api/models';
import { Logger } from './logger';

@Injectable({
  providedIn: 'root'
})
export class VentesService {
  private ventesAuVendeurSubject = new BehaviorSubject<VenteAuVendeur[]>([]);
  public ventesAuVendeur$ = this.ventesAuVendeurSubject.asObservable();

  private ventesDuVendeurSubject = new BehaviorSubject<VenteDuVendeur[]>([]);
  public ventesDuVendeur$ = this.ventesDuVendeurSubject.asObservable();

  constructor(
    private api: Api,
    private webhookService: WebhookService,
    private logger: Logger
  ) {
    this.init();
  }

  private init() {
    this.refreshVentesAuVendeur();
    this.refreshVentesDuVendeur();

    this.webhookService.events$.subscribe(event => {
      if (event === WebhookEventType.VENTE_AU_VENDEUR_CREATED) {
        this.refreshVentesAuVendeur();
      }
      if (event === WebhookEventType.VENTE_DU_VENDEUR_CREATED) {
        this.refreshVentesDuVendeur();
      }
    });
  }

  public refreshVentesAuVendeur() {
    from(this.api.invoke(listerVentes, { type: 'AU_VENDEUR' })).subscribe({
      next: (data) => this.ventesAuVendeurSubject.next(data as VenteAuVendeur[]),
      error: (err) => this.logger.error('Error fetching ventes au vendeur', null, err)
    });
  }

  public refreshVentesDuVendeur() {
     from(this.api.invoke(listerVentes, { type: 'DU_VENDEUR' })).subscribe({
      next: (data) => this.ventesDuVendeurSubject.next(data as VenteDuVendeur[]),
      error: (err) => this.logger.error('Error fetching ventes du vendeur', null, err)
    });
  }
}
