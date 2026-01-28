import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Commercial } from './commercial';

describe('Commercial', () => {
  let component: Commercial;
  let fixture: ComponentFixture<Commercial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Commercial]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Commercial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
