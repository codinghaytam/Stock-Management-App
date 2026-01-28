import { Component, OnInit } from '@angular/core';
import { StockService } from '../../services/stock';
import { Api } from '../../api/api';
import { ajouterChariot } from '../../api/fn/emballage/ajouter-chariot';
import { supprimerChariot } from '../../api/fn/emballage/supprimer-chariot';
import { ajouterBoiteChariot } from '../../api/fn/emballage/ajouter-boite-chariot';
import { retirerBoiteChariot } from '../../api/fn/emballage/retirer-boite-chariot';
import { Chariot } from '../../api/models/chariot';
import { Observable, combineLatest, map } from 'rxjs';
import { Logger } from '../../services/logger';

@Component({
  selector: 'app-emballage',
  standalone: false,
  templateUrl: './emballage.html',
  styleUrl: './emballage.css',
})
export class Emballage {
  
  chariots$: Observable<Chariot[]>;
  summary$: Observable<any>;
  stats$: Observable<{ totalChariots: number; totalBoxes: number; averageFill: number }>;
  kpi$: Observable<PackagingKpi>;
  loading$: Observable<boolean>;
  selectedChariot: Chariot | null = null;
  
  // Interaction State
  modifyingChariotId: number | null = null;
  boxIdInput: number | null = null;
  actionLoading = false;
  feedback: { type: 'success' | 'error' | 'info'; message: string } | null = null;

  constructor(
    public stockService: StockService,
    private api: Api,
    private logger: Logger
  ) {
    this.chariots$ = this.stockService.state$.pipe(map(s => s.chariots));
    this.summary$ = this.stockService.state$.pipe(map(s => s.summary));
    this.loading$ = this.stockService.state$.pipe(map(s => s.loading));
    this.stats$ = this.chariots$.pipe(
      map((chariots = []) => {
        const totalBoxes = chariots.reduce((acc, chariot) => acc + (chariot.boites?.length ?? 0), 0);
        const totalChariots = chariots.length;
        const averageFill = totalChariots ? totalBoxes / totalChariots : 0;
        return { totalChariots, totalBoxes, averageFill };
      }),
    );

    this.kpi$ = combineLatest([this.stats$, this.summary$]).pipe(
      map(([stats, summary]) => ({
        totalChariots: stats.totalChariots,
        totalBoxes: summary?.boitesEmballees ?? stats.totalBoxes,
      })),
    );

  }

  openChariot(chariot: Chariot) {
    this.selectedChariot = chariot;
    this.modifyingChariotId = chariot.id ?? null;
    this.boxIdInput = null;
  }

  getCard(chariot: Chariot): ChariotCard {
    return this.toCard(chariot);
  }

  closeChariot() {
    this.selectedChariot = null;
    this.modifyingChariotId = null;
    this.boxIdInput = null;
  }

  createChariot() {
    if(!confirm('Create a new empty Chariot?')) return;
    
    this.actionLoading = true;
    this.api.invoke(ajouterChariot, {}).then(() => {
      this.actionLoading = false;
      // Webhook should handle refresh, but we can force it
      this.stockService.refreshStock(); 
      this.setFeedback('success', 'Nouveau chariot créé.');
    }).catch(e => {
      this.logger.error('Failed to create chariot', null, e);
      this.setFeedback('error', e.error?.message || 'Création du chariot impossible.');
      this.actionLoading = false;
    });
  }

  deleteChariot(id: number) {
    if(!confirm(`Delete Chariot #${id}? This will release the boxes.`)) return;
    
    this.actionLoading = true;
    this.api.invoke(supprimerChariot, { index: id }).then(() => {
      this.actionLoading = false;
      this.stockService.refreshStock();
      this.setFeedback('success', `Chariot #${id} supprimé.`);
      if (this.selectedChariot?.id === id) {
        this.closeChariot();
      }
    }).catch(e => {
      this.logger.error('Failed to delete chariot', { id }, e);
      this.setFeedback('error', e.error?.message || "Suppression du chariot impossible.");
      this.actionLoading = false;
    });
  }

  setModifier(chariotId: number) {
    this.modifyingChariotId = chariotId;
    this.boxIdInput = null;
  }

  addBoxToChariot(chariotId: number) {
    if (!this.boxIdInput) return;
    
    this.actionLoading = true;
    this.api.invoke(ajouterBoiteChariot, { 
      index: chariotId, 
      body: { boite: { id: this.boxIdInput } as any } 
    }).then(() => {
      this.actionLoading = false;
      this.modifyingChariotId = null;
      this.boxIdInput = null;
      this.stockService.refreshStock();
      this.setFeedback('success', `Boîte ajoutée au chariot #${chariotId}.`);
    }).catch(e => {
      this.logger.error('Failed to add box to chariot', { chariotId, boxId: this.boxIdInput }, e);
      this.setFeedback('error', e.error?.message || "Impossible d'ajouter la boîte au chariot.");
      this.actionLoading = false;
    });
  }

  removeBoxFromChariot(chariotId: number, boiteId: number) {
    if(!confirm(`Remove Box #${boiteId} from Chariot #${chariotId}?`)) return;

    this.actionLoading = true;
    this.api.invoke(retirerBoiteChariot, { 
      index: chariotId, 
      indexBoite: boiteId 
    }).then(() => {
      this.actionLoading = false;
      this.stockService.refreshStock();
      this.setFeedback('success', `Boîte #${boiteId} retirée du chariot #${chariotId}.`);
    }).catch(e => {
      this.logger.error('Failed to remove box from chariot', { chariotId, boiteId }, e);
      this.setFeedback('error', e.error?.message || "Impossible de retirer la boîte du chariot.");
      this.actionLoading = false;
    });
  }

  private toCard(chariot: Chariot): ChariotCard {
    const loadCount = chariot.boites?.length ?? 0;
    if (loadCount === 0) {
      return { id: chariot.id ?? 0, loadCount, status: 'Empty', statusClass: 'status-empty' };
    }
    if (loadCount >= 90) {
      return { id: chariot.id ?? 0, loadCount, status: 'Overloaded', statusClass: 'status-over' };
    }
    if (loadCount >= 60) {
      return { id: chariot.id ?? 0, loadCount, status: 'Near Full', statusClass: 'status-near' };
    }
    return { id: chariot.id ?? 0, loadCount, status: 'In Use', statusClass: 'status-use' };
  }

  private setFeedback(type: 'success' | 'error' | 'info', message: string) {
    this.feedback = { type, message };
  }
}

interface PackagingKpi {
  totalChariots: number;
  totalBoxes: number;
}

interface ChariotCard {
  id: number;
  loadCount: number;
  status: string;
  statusClass: string;
}
