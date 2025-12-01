import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarAuto } from './editar-auto';

describe('EditarAuto', () => {
  let component: EditarAuto;
  let fixture: ComponentFixture<EditarAuto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarAuto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarAuto);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
