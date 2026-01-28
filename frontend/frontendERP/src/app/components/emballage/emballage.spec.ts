import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Emballage } from './emballage';

describe('Emballage', () => {
  let component: Emballage;
  let fixture: ComponentFixture<Emballage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Emballage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Emballage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
