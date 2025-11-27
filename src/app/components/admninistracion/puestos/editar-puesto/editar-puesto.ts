import { Component, EventEmitter, Output, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { EmpleadosService, Puesto } from '../../../../services/administrador/empleados';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators'; import { SolonumerosDinero } from "../../../../directives/solonuermos";

@Component({
  selector: 'app-editar-puesto',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SolonumerosDinero],
  templateUrl: './editar-puesto.html',
  styleUrl: './editar-puesto.css',
})
export class EditarPuesto implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  form!: FormGroup;
  loading = false;

  nvl_usuario = [
    { id_nvl_usuario: 1, descripcion: 'Cliente' },
    { id_nvl_usuario: 2, descripcion: 'Mesero' },
    { id_nvl_usuario: 3, descripcion: 'Cocinero' },
    { id_nvl_usuario: 4, descripcion: 'Cajero' },
    { id_nvl_usuario: 5, descripcion: 'Repartidor' },
    { id_nvl_usuario: 6, descripcion: 'Administrador' },
  ];

  @Output() volver = new EventEmitter<void>();

  @Input() id_puesto: number = 0;
  Puesto: Puesto | null = null;

  constructor(
    private empleadosService: EmpleadosService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();

    this.cargar_datos_puestos();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      Nombre_puesto: ['', [Validators.required, Validators.minLength(2)]],
      Sueldo: ['', [Validators.required, Validators.min(1)]],
      id_nvl_usuario: ['', [Validators.required]],
      estatus: ['', [Validators.required]]
    });
  }

  cargar_datos_puestos() {
    this.empleadosService.getPuestoById(this.id_puesto).subscribe({
      next: (data) => {
        this.Puesto = data;

        // CARGAR LOS DATOS EN EL FORMULARIO
        this.form.patchValue({
          Nombre_puesto: data.Nombre_puesto,
          Sueldo: data.Sueldo!.toLocaleString('es-MX'), // Format con comas
          id_nvl_usuario: data.id_nvl_usuario,
          estatus: data.estatus
        });
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar datos del puesto',
          text: error.message || 'Ocurrió un error inesperado.',
          confirmButtonColor: '#773832'
        });
      }
    });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  editar_usuario(): void {

    if (this.form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Completa todos los campos correctamente.',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    const nuevoPuesto: Partial<Puesto> = this.form.getRawValue();

    const rolDesc = this.nvl_usuario.find(r => r.id_nvl_usuario == nuevoPuesto.id_nvl_usuario)?.descripcion;

    Swal.fire({
      title: `¿Editar puesto ${this.Puesto?.Nombre_puesto}?`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Nombre del puesto:</strong> ${nuevoPuesto.Nombre_puesto} </p>
          <p><strong>Sueldo:</strong> ${nuevoPuesto.Sueldo}</p>
          <p><strong>Rol de usuario:</strong> ${rolDesc}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardarEmpleado(nuevoPuesto);
      }
    });
  }

  private guardarEmpleado(puesto: Partial<Puesto>): void {
    this.loading = true;

    puesto.Sueldo = Number(puesto.Sueldo!.toString().replace(/,/g, ''));
    puesto.estatus = puesto.estatus!.toString() === "true" ? true : false;

    this.empleadosService.updatePuesto(this.id_puesto, puesto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {

          const rolDesc = this.nvl_usuario.find(r => r.id_nvl_usuario == response.id_nvl_usuario)?.descripcion;

          Swal.fire({
            title: 'Puesto creado',
            text: 'Puesto creado exitosamente',
            confirmButtonColor: '#d4af37',
          }).then(() => {
            this.loading = false;
            this.form.reset();
            this.volver.emit();
          });
        },
        error: (error) => {
          this.loading = false;

          Swal.fire({
            icon: 'error',
            title: 'Error al crear puesto',
            text: error.message || 'Ocurrió un error inesperado.',
            confirmButtonColor: '#773832'
          });
        }
      });
  }

  regresar(): void {
    if (this.form.dirty) {
      Swal.fire({
        title: '¿Salir sin guardar?',
        text: 'Tienes cambios sin guardar. ¿Deseas salir?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d4af37',
        cancelButtonColor: '#773832',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.volver.emit();
        }
      });
    } else {
      this.volver.emit();
    }
  }
}
