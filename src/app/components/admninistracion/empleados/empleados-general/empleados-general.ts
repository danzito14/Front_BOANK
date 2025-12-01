import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { EmpleadosService, Empleado, Puesto, Uniforme } from '../../../../services/administrador/empleados';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interfaz para configuración de columnas
interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'status' | 'currency';
  format?: (value: any) => string;
  visible?: boolean;
}

// Interfaz para configuración de tabla
interface TableConfig {
  columns: ColumnConfig[];
  loadDataMethod: string;
  itemsPerPage?: number;
  showActions?: boolean;
  actions?: {
    edit?: boolean;
    delete?: boolean;
    view?: boolean;
  };
}

@Component({
  selector: 'app-empleados-general',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './empleados-general.html',
  styleUrl: './empleados-general.css',
})
export class EmpleadosGeneral implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() id_empleado_seleccionado = new EventEmitter<any>();
  @Output() destino = new EventEmitter<string>();

  @Input() tab: string = "";

  // Datos y estado de la tabla
  tableData: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];
  loading: boolean = false;
  error: string = '';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 15;
  totalPages: number = 1;

  // Búsqueda
  searchTerm: string = '';

  // Configuraciones para cada pestaña
  tableConfigs: { [key: string]: TableConfig } = {
    empleados: {
      loadDataMethod: 'getAllEmpleados',
      columns: [
        { key: 'Nombre', label: 'Nombre', type: 'text' },
        { key: 'Apellido', label: 'Apellido', type: 'text' },
        { key: 'Correo_electronico', label: 'Correo', type: 'text' },
        { key: 'id_puesto', label: 'Puesto', type: 'text' },
        { key: 'Num_telefonico', label: 'Teléfono', type: 'text' },
        { key: 'Ciudad', label: 'Ciudad', type: 'text' },
        { key: 'Fecha_de_contratacion', label: 'Fecha Contratación', type: 'date' },
        {
          key: 'estatus',
          label: 'Estado',
          type: 'status',
          format: (value: boolean) => value === true ? 'Activo' : 'Inactivo'
        }
      ],
      itemsPerPage: 10,
      showActions: true,
      actions: { edit: true, view: true }
    },
    puestos: {
      loadDataMethod: 'getAllPuestos',
      columns: [
        { key: 'Nombre_puesto', label: 'Nombre del Puesto', type: 'text' },
        {
          key: 'Sueldo',
          label: 'Sueldo',
          type: 'currency',
          format: (value: number) => this.empleadosService.formatSueldo(value)
        },
        {
          key: 'estatus',
          label: 'Estado',
          type: 'status',
          format: (value: boolean) => value === true ? 'Activo' : 'Inactivo'
        }
      ],
      itemsPerPage: 10,
      showActions: true,
      actions: { edit: true, delete: true }
    },
    uniformes: {
      loadDataMethod: 'getAllUniformes',
      columns: [
        { key: 'Descripcion', label: 'Descripción', type: 'text' },
        { key: 'Talla', label: 'Talla', type: 'text' },
        { key: 'id_puesto', label: 'ID Puesto', type: 'text' },
        {
          key: 'estatus',
          label: 'Estado',
          type: 'status',
          format: (value: boolean) => value === true ? 'Disponible' : 'No disponible'
        }
      ],
      itemsPerPage: 10,
      showActions: true,
      actions: { edit: true, delete: true }
    }
  };

  constructor(
    private empleadosService: EmpleadosService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadTableData();

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getId(item: any, tab: string) {
    switch (tab) {
      case "empleados":
        return item.id_empleado;

      case "puestos":
        return item.id_puesto;

      case "uniformes":
        return item.id_uniforme;

      default:
        console.error("Tab desconocido:", tab);
        return null;
    }
  }


  // Obtiene la configuración actual según la pestaña activa
  get currentConfig(): TableConfig {
    return this.tableConfigs[this.tab] || this.tableConfigs['empleados'];
  }

  // Cargar datos usando el servicio
  loadTableData(): void {
    this.loading = true;
    this.error = '';
    const config = this.currentConfig;
    const methodName = config.loadDataMethod as keyof EmpleadosService;

    // Llamada dinámica al método del servicio
    const serviceMethod = this.empleadosService[methodName] as Function;

    if (typeof serviceMethod === 'function') {
      serviceMethod.call(this.empleadosService)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: any[]) => {
            this.tableData = data;
            this.applyFilters();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (error: Error) => {
            console.error('Error cargando datos:', error);
            this.error = error.message;
            this.loading = false;
            // this.loadMockData(); // Fallback a datos de prueba
            this.cdr.detectChanges();
          }
        });
    } else {
      console.error('Método no encontrado:', methodName);
      this.loading = false;
    }
  }


  // Cambiar de pestaña
  changeTab(newTab: string): void {
    this.tab = newTab;
    this.currentPage = 1;
    this.searchTerm = '';
    this.loadTableData();
  }

  // Aplicar filtros y búsqueda
  applyFilters(): void {
    let filtered = [...this.tableData];

    // Búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        return this.currentConfig.columns.some(col => {
          const value = item[col.key];
          return value && value.toString().toLowerCase().includes(term);
        });
      });
    }

    this.filteredData = filtered;
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    this.updatePaginatedData();
  }

  // Actualizar datos paginados
  updatePaginatedData(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  // Formatear valor de celda
  formatCellValue(item: any, column: ColumnConfig): string {
    const value = item[column.key];

    if (column.format) {
      return column.format(value);
    }

    if (column.type === 'date' && value) {
      return this.empleadosService.formatFecha(value);
    }

    if (column.type === 'currency' && value !== null && value !== undefined) {
      return this.empleadosService.formatSueldo(value);
    }

    return value !== null && value !== undefined ? value.toString() : '—';
  }

  // Obtener clase de badge para estado
  getStatusClass(item: any, column: ColumnConfig): string {
    const value = item[column.key];
    return value === true ? 'badge-activo' : 'badge-inactivo';
  }

  // Obtener ID del item (busca diferentes posibles campos ID)
  getItemId(item: any): string | number {
    return item.__id_empleado__ || item.__id_puesto__ || item.__id_uniforme__ || item.id || '';
  }

  // Acciones
  onEdit(id_empleado: string, destino: string): void {
    this.id_empleado_seleccionado.emit(id_empleado);
    this.destino.emit(destino);
    console.log(id_empleado, destino);
  }


  onAgregar(tipo_agregar: string) {
    let destino = "agregar_" + tipo_agregar;
    this.destino.emit(destino);

  }


  onDelete(item: any): void {
    const id = this.getItemId(item);

    if (confirm(`¿Estás seguro de eliminar este ${this.tab}?`)) {
      this.loading = true;

      // Llamada al servicio de eliminación según la pestaña
      let deleteMethod: any;

      switch (this.tab) {
        case 'empleados':
          deleteMethod = this.empleadosService.deleteEmpleado(id as string);
          break;
        case 'puestos':
          // deleteMethod = this.empleadosService.deletePuesto(id as number);
          break;
        case 'uniformes':
          // deleteMethod = this.empleadosService.deleteUniforme(id as number);
          break;
      }

      if (deleteMethod) {
        deleteMethod
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              console.log('Eliminado correctamente');
              this.loadTableData(); // Recargar datos
            },
            error: (error: Error) => {
              console.error('Error al eliminar:', error);
              alert('Error al eliminar: ' + error.message);
              this.loading = false;
            }
          });
      }
    }
  }

  // Búsqueda
  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // Paginación
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get showingFrom(): number {
    return this.filteredData.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);
  }
}