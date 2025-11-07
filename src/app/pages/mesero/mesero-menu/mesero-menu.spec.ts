import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeseroMenu } from './mesero-menu';

describe('MeseroMenu', () => {
  let component: MeseroMenu;
  let fixture: ComponentFixture<MeseroMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeseroMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeseroMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
