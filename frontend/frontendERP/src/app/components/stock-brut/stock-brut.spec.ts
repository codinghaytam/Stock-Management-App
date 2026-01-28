import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockBrut } from './stock-brut';

describe('StockBrut', () => {
  let component: StockBrut;
  let fixture: ComponentFixture<StockBrut>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StockBrut]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockBrut);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
