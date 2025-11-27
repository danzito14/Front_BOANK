import { Component, EventEmitter, Output, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { EmpleadosService, Uniforme, Puesto, Empleado } from '../../../../services/administrador/empleados';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-editar-uniforme',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './editar-uniforme.html',
  styleUrl: './editar-uniforme.css',
})
export class EditarUniforme implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  form!: FormGroup;
  loading = false;
  puestos: Puesto[] = [];
  uniformesAlternativos: Uniforme[] = [];
  empleadosAfectados: Empleado[] = [];

  tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  @Output() volver = new EventEmitter<void>();
  @Input() id_uniforme: number = 0;
  Uniforme: Uniforme | null = null;
  estatusOriginal: boolean = true;

  constructor(
    private empleadosService: EmpleadosService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarPuestos();
    this.cargarDatosUniforme();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      id_puesto: ['', [Validators.required]],
      Talla: ['', [Validators.required]],
      Descripcion: ['', [Validators.required, Validators.minLength(3)]],
      estatus: ['', [Validators.required]]
    });
  }

  cargarPuestos(): void {
    this.empleadosService.getAllPuestos()
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

  cargarDatosUniforme(): void {
    this.empleadosService.getUniformeById(this.id_uniforme).subscribe({
      next: (data) => {
        this.Uniforme = data;
        this.estatusOriginal = data.estatus;

        this.form.patchValue({
          id_puesto: data.id_puesto,
          Talla: data.Talla,
          Descripcion: data.Descripcion,
          estatus: data.estatus
        });

        // Cargar empleados que usan este uniforme
        this.cargarEmpleadosAfectados();
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar datos del uniforme',
          text: error.message || 'Ocurrió un error inesperado.',
          confirmButtonColor: '#773832'
        });
      }
    });
  }

  cargarEmpleadosAfectados(): void {
    this.empleadosService.getEmpleadosByUniforme(this.id_uniforme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empleados) => {
          this.empleadosAfectados = empleados;
        },
        error: (error) => {
          console.error('Error al cargar empleados:', error);
        }
      });
  }

  async editar_uniforme(): Promise<void> {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Completa todos los campos correctamente.',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    const uniformeActualizado: Partial<Uniforme> = this.form.getRawValue();

    // Convertir estatus string a boolean para comparación
    const estatusNuevo = uniformeActualizado.estatus!.toString() === "true";
    const cambioEstatus = this.estatusOriginal === true && !estatusNuevo;

    // SIEMPRE preguntar si hay cambio de estatus a inactivo
    if (cambioEstatus) {
      if (this.empleadosAfectados.length > 0) {
        // Hay empleados afectados - OBLIGATORIO seleccionar reemplazo
        await this.manejarDesactivacionConEmpleados(uniformeActualizado);
      } else {
        // No hay empleados afectados - Informar y continuar
        Swal.fire({
          icon: 'info',
          title: 'Desactivando uniforme',
          html: `
            <p>Este uniforme será marcado como <strong>INACTIVO</strong>.</p>
            <p>Actualmente no hay empleados usando este uniforme.</p>
          `,
          showCancelButton: true,
          confirmButtonColor: '#d4af37',
          cancelButtonColor: '#773832',
          confirmButtonText: 'Continuar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.confirmarEdicion(uniformeActualizado, null);
          }
        });
      }
    } else {
      // No hay cambio de estatus o se está activando
      this.confirmarEdicion(uniformeActualizado, null);
    }
  }

  private async manejarDesactivacionConEmpleados(uniformeActualizado: Partial<Uniforme>): Promise<void> {
    // Mostrar alerta inicial sobre empleados afectados
    const continuarBusqueda = await Swal.fire({
      icon: 'warning',
      title: ' Empleados Afectados',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p style="font-size: 16px; margin-bottom: 15px;">
            <strong>${this.empleadosAfectados.length} empleado(s)</strong> están usando este uniforme:
          </p>
          <ul style="margin-bottom: 20px; max-height: 150px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 5px;">
            ${this.empleadosAfectados.map(e => `<li style="margin: 5px 0;"><strong>${e.Nombre} ${e.Apellido}</strong></li>`).join('')}
          </ul>
          <p style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 5px;">
            <strong> Importante:</strong> Debes seleccionar un uniforme alternativo para reasignar a estos empleados.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar'
    });

    if (!continuarBusqueda.isConfirmed) {
      return;
    }

    // Cargar uniformes alternativos del mismo puesto
    this.empleadosService.getUniformesByPuesto(uniformeActualizado.id_puesto!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (uniformes) => {
          // Filtrar el uniforme actual
          this.uniformesAlternativos = uniformes.filter(u => u.id_uniforme !== this.id_uniforme);

          if (this.uniformesAlternativos.length === 0) {
            // NO HAY UNIFORMES ALTERNATIVOS
            Swal.fire({
              icon: 'error',
              title: ' No hay uniformes alternativos',
              html: `
                <div style="text-align: left; margin: 20px 0;">
                  <p style="margin-bottom: 10px;">
                    <strong>${this.empleadosAfectados.length} empleado(s)</strong> están usando este uniforme.
                  </p>
                  <p style="color: #721c24; background: #f8d7da; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                    <strong> No hay otros uniformes activos</strong> del puesto "<strong>${this.puestos.find(p => p.id_puesto === uniformeActualizado.id_puesto)?.Nombre_puesto}</strong>" para reasignar.
                  </p>
                  <p><strong>Opciones:</strong></p>
                  <ol style="text-align: left; margin-left: 20px;">
                    <li>Crear un nuevo uniforme primero</li>
                    <li>Dejar a los empleados sin uniforme asignado (no recomendado)</li>
                  </ol>
                </div>
              `,
              showCancelButton: true,
              showDenyButton: true,
              confirmButtonColor: '#773832',
              denyButtonColor: '#d4af37',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Dejar sin uniforme',
              denyButtonText: 'Cancelar operación',
              cancelButtonText: 'Ir a crear uniforme'
            }).then((result) => {
              if (result.isConfirmed) {
                // Usuario confirmó dejar sin uniforme
                this.confirmarSinUniforme(uniformeActualizado);
              } else if (result.dismiss === Swal.DismissReason.cancel) {
                // Ir a crear uniforme (aquí podrías emitir un evento para navegar)
                Swal.fire({
                  icon: 'info',
                  title: 'Crea un uniforme primero',
                  text: 'Por favor crea un nuevo uniforme antes de desactivar este.',
                  confirmButtonColor: '#d4af37'
                });
              }
              // Si es deny o cierra, simplemente no hace nada
            });
            return;
          }

          // SÍ HAY UNIFORMES ALTERNATIVOS - Mostrar selector
          await this.mostrarSelectorUniformeAlternativo(uniformeActualizado);
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al cargar uniformes alternativos',
            text: error.message,
            confirmButtonColor: '#773832'
          });
        }
      });
  }

  private async mostrarSelectorUniformeAlternativo(uniformeActualizado: Partial<Uniforme>): Promise<void> {
    const opcionesHTML = this.uniformesAlternativos
      .map(u => `<option value="${u.id_uniforme}">Talla ${u.Talla} - ${u.Descripcion}</option>`)
      .join('');

    const { value: uniformeSeleccionado } = await Swal.fire({
      title: ' Reasignar uniforme',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p style="margin-bottom: 15px; font-size: 15px;">
            Selecciona el <strong>uniforme de reemplazo</strong> para los <strong>${this.empleadosAfectados.length} empleado(s)</strong>:
          </p>
          <ul style="margin-bottom: 20px; max-height: 120px; overflow-y: auto; background: #e8f4f8; padding: 10px 15px; border-radius: 5px; font-size: 14px;">
            ${this.empleadosAfectados.map(e => `<li style="margin: 3px 0;">${e.Nombre} ${e.Apellido}</li>`).join('')}
          </ul>
          <label for="uniforme-alternativo" style="display: block; margin-bottom: 8px; font-weight: 600;">
            Nuevo uniforme: <span style="color: #773832;">*</span>
          </label>
          <select id="uniforme-alternativo" class="swal2-select" style="width: 100%; font-size: 16px;">
            <option value="">-- Selecciona un uniforme --</option>
            ${opcionesHTML}
          </select>
          <p style="margin-top: 15px; font-size: 13px; color: #6c757d; font-style: italic;">
             También puedes dejarlo vacío para que queden sin uniforme asignado
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Confirmar reasignación',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      preConfirm: () => {
        const select = document.getElementById('uniforme-alternativo') as HTMLSelectElement;
        const valor = select.value;

        if (!valor) {
          // Usuario dejó vacío - confirmar que quiere dejar sin uniforme
          Swal.showValidationMessage('Por favor selecciona un uniforme o confirma que deseas dejar sin uniforme');
          return false;
        }

        return valor;
      }
    });

    if (uniformeSeleccionado !== undefined) {
      if (uniformeSeleccionado) {
        const idUniformeNuevo = parseInt(uniformeSeleccionado);
        this.confirmarEdicion(uniformeActualizado, idUniformeNuevo);
      } else {
        // Usuario confirmó dejar sin uniforme
        this.confirmarSinUniforme(uniformeActualizado);
      }
    }
  }

  private confirmarSinUniforme(uniformeActualizado: Partial<Uniforme>): void {
    Swal.fire({
      title: ' Confirmar: Sin Uniforme',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p style="color: #721c24; background: #f8d7da; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <strong>Advertencia:</strong> Los siguientes empleados quedarán <strong>SIN UNIFORME ASIGNADO</strong>:
          </p>
          <ul style="margin-bottom: 15px; max-height: 150px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 5px;">
            ${this.empleadosAfectados.map(e => `<li style="margin: 5px 0;">${e.Nombre} ${e.Apellido}</li>`).join('')}
          </ul>
          <p style="font-size: 14px;">¿Estás seguro de continuar?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#773832',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, dejar sin uniforme',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmarEdicion(uniformeActualizado, null);
      }
    });
  }

  private confirmarEdicion(uniformeActualizado: Partial<Uniforme>, idUniformeNuevo: number | null = null): void {
    const puestoNombre = this.puestos.find(p => p.id_puesto == uniformeActualizado.id_puesto)?.Nombre_puesto;

    let mensajeAdicional = '';
    if (idUniformeNuevo !== null && idUniformeNuevo > 0) {
      const uniformeNuevo = this.uniformesAlternativos.find(u => u.id_uniforme === idUniformeNuevo);
      mensajeAdicional = `
        <p style="color: #155724; background: #d4edda; padding: 10px; border-radius: 5px; margin-top: 10px;">
          <strong> Se reasignará a:</strong> Talla ${uniformeNuevo?.Talla} - ${uniformeNuevo?.Descripcion}
        </p>
      `;
    } else if (this.empleadosAfectados.length > 0 && uniformeActualizado.estatus!.toString() === "false") {
      mensajeAdicional = `
        <p style="color: #721c24; background: #f8d7da; padding: 10px; border-radius: 5px; margin-top: 10px;">
          <strong> ${this.empleadosAfectados.length} empleado(s) quedarán sin uniforme asignado</strong>
        </p>
      `;
    }

    Swal.fire({
      title: `¿Actualizar uniforme?`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Puesto:</strong> ${puestoNombre}</p>
          <p><strong>Talla:</strong> ${uniformeActualizado.Talla}</p>
          <p><strong>Descripción:</strong> ${uniformeActualizado.Descripcion}</p>
          <p><strong>Estatus:</strong> <span style="color: ${uniformeActualizado.estatus!.toString() === "true" ? '#155724' : '#721c24'};">${uniformeActualizado.estatus!.toString() === "true" ? 'Activo' : 'Inactivo'}</span></p>
          ${mensajeAdicional}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardarUniforme(uniformeActualizado, idUniformeNuevo);
      }
    });
  }

  private guardarUniforme(uniforme: Partial<Uniforme>, idUniformeNuevo: number | null): void {
    this.loading = true;

    // Convertir estatus a boolean
    uniforme.estatus = uniforme.estatus!.toString() === "true";

    const requests: any[] = [
      this.empleadosService.updateUniforme(this.id_uniforme, uniforme)
    ];

    // Si hay que reasignar empleados
    if (idUniformeNuevo !== null && idUniformeNuevo > 0 && this.empleadosAfectados.length > 0) {
      const empleadosIds = this.empleadosAfectados.map(e => e.id_empleado || e.__id_empleado__!);
      requests.push(
        this.empleadosService.actualizarUniformeEmpleados(empleadosIds, idUniformeNuevo)
      );
    } else if ((idUniformeNuevo === null || idUniformeNuevo === 0) && this.empleadosAfectados.length > 0 && !uniforme.estatus) {
      // Dejar empleados sin uniforme (asignar NULL o 0)
      const empleadosIds = this.empleadosAfectados.map(e => e.id_empleado || e.__id_empleado__!);
      requests.push(
        this.empleadosService.actualizarUniformeEmpleados(empleadosIds, 0)
      );
    }

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          let mensajeExito = 'El uniforme se ha actualizado exitosamente';

          if (this.empleadosAfectados.length > 0) {
            if (idUniformeNuevo && idUniformeNuevo > 0) {
              mensajeExito = `El uniforme se actualizó y se reasignó correctamente a ${this.empleadosAfectados.length} empleado(s)`;
            } else {
              mensajeExito = `El uniforme se actualizó. ${this.empleadosAfectados.length} empleado(s) ahora sin uniforme asignado`;
            }
          }

          Swal.fire({
            icon: 'success',
            title: 'Uniforme actualizado',
            text: mensajeExito,
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
            title: 'Error al actualizar uniforme',
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