import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuariosGeneral } from './usuarios-general';

describe('UsuariosGeneral', () => {
  let component: UsuariosGeneral;
  let fixture: ComponentFixture<UsuariosGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosGeneral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuariosGeneral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
