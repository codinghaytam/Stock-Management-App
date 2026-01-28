import { Component, OnInit } from '@angular/core';
import { Api } from '../../api/api';
import { listerVentes } from '../../api/fn/ventes/lister-ventes';
import { enregistrerVente } from '../../api/fn/ventes/enregistrer-vente';
import { Vente } from '../../api/models/vente';
import { VenteType } from '../../api/models/vente-type';
import { LigneRequest } from '../../api/models/ligne-request';
import { VentesService } from '../../services/ventes';
import { Logger } from '../../services/logger';

@Component({
  selector: 'app-ventes',
  standalone: false,
  templateUrl: './ventes.html',
  styleUrl: './ventes.css',
})
export class Ventes implements OnInit {
  
  activeTab: 'AU_VENDEUR' | 'DU_VENDEUR' = 'AU_VENDEUR';
  ventes: Vente[] = [];
  loading = false;
  feedbackMessage: string | null = null;
  feedbackType: 'success' | 'error' | 'info' = 'info';
  formError: string | null = null;
  
  // Creation Form
  showCreate = false;
  newSale: {
    type: VenteType;
    vendeurId: string;
    lignes: LigneRequest[];
  } = {
    type: 'AU_VENDEUR',
    vendeurId: '',
    lignes: []
  };

  // Temp Line Input
  newLine: Partial<LigneRequest> = {
    typeLigne: 'BOITE',
    produitId: '1L',
    quantite: 1,
    prixUnitaire: 0
  };

  productOptions = [
    { label: 'Bouteille 1L', type: 'BOUTEILLE', id: '1L' },
    { label: 'Bouteille 0.5L', type: 'BOUTEILLE', id: '0.5L' },
    { label: 'Bouteille 2L', type: 'BOUTEILLE', id: '2L' },
    { label: 'Bouteille 5L', type: 'BOUTEILLE', id: '5L' },
    { label: 'Carton 1L', type: 'BOITE', id: '1L' },
    { label: 'Carton 0.5L', type: 'BOITE', id: '0.5L' },
    { label: 'Carton 2L', type: 'BOITE', id: '2L' },
    { label: 'Carton 5L', type: 'BOITE', id: '5L' },
  ];

  constructor(
    private api: Api,
    private ventesService: VentesService,
    private logger: Logger
  ) {}

  ngOnInit() {
    this.refresh();
  }

  get tabLabel(): string {
    return this.activeTab === 'AU_VENDEUR' ? 'Ventes au vendeur' : 'Ventes du vendeur';
  }

  get venteCount(): number {
    return this.ventes.length;
  }

  get totalRevenue(): number {
    return this.ventes.reduce((acc, vente) => acc + (vente.montantTotal ?? 0), 0);
  }

  get averageTicket(): number {
    return this.venteCount ? this.totalRevenue / this.venteCount : 0;
  }

  get totalLines(): number {
    return this.ventes.reduce((acc, vente) => acc + (vente.lignes?.length ?? 0), 0);
  }

  setTab(type: 'AU_VENDEUR' | 'DU_VENDEUR') {
    this.activeTab = type;
    this.newSale.type = type as VenteType;
    this.refresh();
  }

  refresh() {
    this.loading = true;
    this.api.invoke(listerVentes, { type: this.activeTab as VenteType }).then(data => {
      this.ventes = data;
      this.loading = false;
    }).catch(e => {
      this.logger.error('Error fetching ventes list', { tab: this.activeTab }, e);
      this.setFeedback('error', 'Impossible de récupérer les ventes pour le moment.');
      this.loading = false;
    });
  }

  toggleCreate() {
    this.showCreate = !this.showCreate;
    // Reset form
    this.newSale = {
        type: this.activeTab as VenteType,
        vendeurId: '',
        lignes: []
    };
    this.formError = null;
    this.newLine = {
      typeLigne: 'BOITE',
      produitId: '1L',
      quantite: 1,
      prixUnitaire: 0,
    };
  }

  addLine() {
    if (!this.newLine.produitId || !this.newLine.quantite || this.newLine.quantite <= 0) {
      this.formError = 'Veuillez sélectionner un produit et une quantité valide.';
      this.logger.warn('Invalid vente line skipped', this.newLine);
      return;
    }
    
    this.newSale.lignes.push({
      typeLigne: this.newLine.typeLigne as 'BOITE' | 'BOUTEILLE',
      produitId: this.newLine.produitId,
      quantite: this.newLine.quantite,
      prixUnitaire: this.newLine.prixUnitaire || 0
    });
    // Reset line but keep some defaults
    this.newLine.quantite = 1;
    this.formError = null;
  }

  removeLine(index: number) {
    this.newSale.lignes.splice(index, 1);
  }

  get totalAmount() {
    return this.newSale.lignes.reduce((acc, l) => acc + (l.quantite * l.prixUnitaire), 0);
  }

  submitSale() {
    if (!this.newSale.vendeurId) {
        this.formError = 'Veuillez saisir un identifiant vendeur.';
        this.logger.warn('Sale submission blocked: missing vendor id', this.newSale);
        return;
    }
    if (this.newSale.lignes.length === 0) {
        this.formError = 'Ajoutez au moins une ligne à la vente.';
        this.logger.warn('Sale submission blocked: no lignes', this.newSale);
        return;
    }

    this.loading = true;
    this.api.invoke(enregistrerVente, { body: this.newSale }).then(() => {
        this.loading = false;
        this.toggleCreate();
        this.refresh();
        // Update global state
        if (this.activeTab === 'AU_VENDEUR') this.ventesService.refreshVentesAuVendeur();
        else this.ventesService.refreshVentesDuVendeur();
        this.setFeedback('success', 'Vente enregistrée avec succès.');
    }).catch(e => {
        this.logger.error('Sale submission failed', this.newSale, e);
        this.formError = e.error?.message || 'Echec de la vente.';
        this.setFeedback('error', this.formError ?? 'Echec de la vente.');
        this.loading = false;
    });
  }

  private setFeedback(type: 'success' | 'error' | 'info', message: string) {
    this.feedbackType = type;
    this.feedbackMessage = message;
  }
}
