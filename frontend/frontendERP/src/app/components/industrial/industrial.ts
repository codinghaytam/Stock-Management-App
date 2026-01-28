import { Component } from '@angular/core';
import { Api } from '../../api/api';
import { Type } from '../../api/models/type';
import { fabriquerBouteille } from '../../api/fn/agent-industriel/fabriquer-bouteille';
import { BouteilleRequest } from '../../api/models/bouteille-request';
import { Logger } from '../../services/logger';
import { StockService } from '../../services/stock';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-industrial',
  standalone: false,
  templateUrl: './industrial.html',
  styleUrl: './industrial.css',
})
export class Industrial {
  types: Type[] = ['ZITBLAD', 'ASSELIA', 'kAULDA'];
  // Assuming these are the standard litrages based on the model doc
  litrages: number[] = [0.5, 1, 2, 5]; 

  form: BouteilleRequest = {
    type: 'ZITBLAD',
    litrage: 1,
    prix: 10 // Default price, though maybe should be 0 or empty?
  };

  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  rawSnapshot$: Observable<Array<{ type: Type; quantity: number }>>;

  constructor(
    private api: Api,
    private logger: Logger,
    private stockService: StockService,
  ) {
    this.rawSnapshot$ = this.stockService.state$.pipe(
      map((state) => this.types.map((type) => ({ type, quantity: state.raw?.[type] ?? 0 }))),
    );
  }

  onSubmit() {
    this.loading = true;
    this.successMessage = null;
    this.errorMessage = null;

    this.api.invoke(fabriquerBouteille, { body: this.form }).then(
      (response) => {
        this.loading = false;
        this.successMessage = `Production successful! Bottle created (ID: ${response.id})`;
        // Optional: Reset form or keep values? Keep values for rapid entry.
      },
      (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Failed to create bottle. Check raw stock availability.';
        this.logger.error('Failed to create bottle', this.form, error);
      }
    );
  }
}
