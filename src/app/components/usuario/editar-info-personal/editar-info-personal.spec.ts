import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarInfoPersonal } from './editar-info-personal';

describe('EditarInfoPersonal', () => {
  let component: EditarInfoPersonal;
  let fixture: ComponentFixture<EditarInfoPersonal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarInfoPersonal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarInfoPersonal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
