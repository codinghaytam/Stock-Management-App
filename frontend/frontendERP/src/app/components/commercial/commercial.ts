import { Component, OnInit } from '@angular/core';
import { Api } from '../../api/api';
import { HttpClient } from '@angular/common/http';
import { Type } from '../../api/models/type';
import { BouteilleRequest } from '../../api/models/bouteille-request';
import { BoiteRequest } from '../../api/models/boite-request';
import { creerBouteilleCommercial } from '../../api/fn/commercial/creer-bouteille-commercial';
import { creerBoite } from '../../api/fn/commercial/creer-boite';
import { Bouteille } from '../../api/models/bouteille';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs'; // Import of
import { environment } from '../../../environments/environment';
import { Logger } from '../../services/logger';

@Component({
  selector: 'app-commercial',
  standalone: false,
  templateUrl: './commercial.html',
  styleUrl: './commercial.css',
})
export class Commercial implements OnInit {
  activeTab: 'bottles' | 'boxes' = 'bottles';

  // Bottle Production
  types: Type[] = ['ZITBLAD', 'ASSELIA', 'kAULDA'];
  litrages: number[] = [0.5, 1, 2, 5];
  bottleForm: BouteilleRequest = { type: 'ZITBLAD', litrage: 1, prix: 10 };

  // Box Production
  availableBottles: Bouteille[] = [];
  selectedBottles: Set<number> = new Set();
  boxForm = {
    litrage: 1,
    prix: 100,
  };
  
  // Status
  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private api: Api,
    private http: HttpClient,
    private logger: Logger
  ) {}

  ngOnInit() {
    this.refreshBottles();
  }

  get availableBottleCount(): number {
    return this.availableBottles.length;
  }

  get activeTypesCount(): number {
    return new Set(this.availableBottles.map((b) => b.type)).size;
  }

  get averageBottlePrice(): number {
    if (!this.availableBottles.length) {
      return 0;
    }
    const total = this.availableBottles.reduce((acc, bottle) => acc + (bottle.prix ?? 0), 0);
    return total / this.availableBottles.length;
  }

  get selectionProgress() {
    const target = this.requiredBottleCount;
    const current = this.selectedBottles.size;
    const ratio = target ? Math.min(1, current / target) : 0;
    const status = current === target ? 'Prêt pour l’assemblage' : current === 0 ? 'Sélectionnez vos bouteilles' : 'Complétez la sélection';
    return { current, target, ratio, status };
  }

  refreshBottles() {
    // Manually fetch bottles since the generated client missed it
    this.http.get<Bouteille[]>(`${environment.apiBaseUrl}/api/commercial/bouteilles`).pipe(
      catchError(err => {
        this.logger.error('Failed to fetch commercial bottles', null, err);
        return of([]);
      })
    ).subscribe(bottles => {
      // Filter for UNBOXED bottles if the API returns all (assuming 'available' or similar logic might be needed)
      // For now, assuming API returns available bottles
      this.availableBottles = bottles || [];
    });
  }

  // Bottle Logic
  createBottle() {
    this.loading = true;
    this.clearMessages();
    this.api.invoke(creerBouteilleCommercial, { body: this.bottleForm }).then(
      (res) => {
        this.loading = false;
        this.successMessage = `Bottle created successfully (ID: ${res.id})`;
        this.refreshBottles();
      },
      (err) => this.handleError(err)
    );
  }

  // Box Logic
  toggleBottleSelection(id: number) {
    if (this.selectedBottles.has(id)) {
      this.selectedBottles.delete(id);
    } else {
      this.selectedBottles.add(id);
    }
  }

  get requiredBottleCount(): number {
    switch (this.boxForm.litrage) {
      case 1:
        return 15;
      case 0.5:
        return 30;
      case 2:
        return 8;
      case 5:
        return 6;
      default:
        return 999;
    }
  }

  get isValidSelection(): boolean {
    // Determine the type of the first selected bottle
    if (this.selectedBottles.size === 0) return false;
    
    // Check if count matches required
    if (this.selectedBottles.size !== this.requiredBottleCount) return false;

    // Ideally check if all selected bottles have the same type and litrage, 
    // but the backend will likely validate that too.
    return true;
  }

  createBox() {
    if (!this.isValidSelection) {
      this.errorMessage = `Invalid selection! Need ${this.requiredBottleCount} bottles of ${this.boxForm.litrage}L.`;
      return;
    }

    this.loading = true;
    this.clearMessages();

    const request: BoiteRequest = {
      bouteilles: Array.from(this.selectedBottles).map(id => ({ id })),
      prix: this.boxForm.prix,
      quantite: 0 // Calculated by backend
    };

    this.api.invoke(creerBoite, { body: request }).then(
      (res) => {
        this.loading = false;
        this.successMessage = `Box created successfully (ID: ${res.id})`;
        this.selectedBottles.clear();
        this.refreshBottles();
      },
      (err) => this.handleError(err)
    );
  }

  private clearMessages() {
    this.successMessage = null;
    this.errorMessage = null;
  }

  private handleError(err: any) {
    this.loading = false;
    this.errorMessage = err.error?.message || 'Operation failed';
    this.logger.error('Commercial operation failed', { tab: this.activeTab, boxForm: this.boxForm, bottleForm: this.bottleForm }, err);
  }
}
