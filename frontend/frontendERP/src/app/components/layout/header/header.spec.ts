import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header';
import { AuthService } from '../../../services/auth';
import { StockService } from '../../../services/stock';
import { VentesService } from '../../../services/ventes';

class AuthStub {
  currentUser$ = of(null);
  logout = jasmine.createSpy('logout');
}

class StockStub {
  state$ = of({ raw: {}, chariots: [], summary: null, loading: false });
}

class VentesStub {
  ventesAuVendeur$ = of([]);
  ventesDuVendeur$ = of([]);
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [HeaderComponent],
      providers: [
        { provide: AuthService, useClass: AuthStub },
        { provide: StockService, useClass: StockStub },
        { provide: VentesService, useClass: VentesStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
