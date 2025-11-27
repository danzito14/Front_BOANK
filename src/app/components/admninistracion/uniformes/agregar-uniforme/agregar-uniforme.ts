import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { EmpleadosService, Uniforme, Puesto } from '../../../../services/administrador/empleados';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-agregar-uniforme',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './agregar-uniforme.html',
  styleUrl: './agregar-uniforme.css',
})
export class AgregarUniforme implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  form!: FormGroup;
  loading = false;
  puestos: Puesto[] = [];

  tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  @Output() volver = new EventEmitter<void>();

  constructor(
    private empleadosService: EmpleadosService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarPuestos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      id_puesto: ['', [Validators.required]],
      Talla: ['', [Validators.required]],
      Descripcion: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  cargarPuestos(): void {
    this.empleadosService.getPuestosActivos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (puestos) => {
          this.puestos = puestos;
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al cargar puestos',
            text: error.message,
            confirmButtonColor: '#773832'
          });
        }
      });
  }

  create_uniforme(): void {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Completa todos los campos correctamente.',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    const nuevoUniforme: Partial<Uniforme> = this.form.getRawValue();
    const puestoNombre = this.puestos.find(p => p.id_puesto == nuevoUniforme.id_puesto)?.Nombre_puesto;

    Swal.fire({
      title: '¿Crear nuevo uniforme?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Puesto:</strong> ${puestoNombre}</p>
          <p><strong>Talla:</strong> ${nuevoUniforme.Talla}</p>
          <p><strong>Descripción:</strong> ${nuevoUniforme.Descripcion}</p>
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
        this.guardarUniforme(nuevoUniforme);
      }
    });
  }

  private guardarUniforme(uniforme: Partial<Uniforme>): void {
    this.loading = true;

    this.empleadosService.createUniforme(uniforme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Uniforme creado',
            text: 'El uniforme se ha creado exitosamente',
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
            title: 'Error al crear uniforme',
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