import { Component, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PlatillosService, Platillo, TipoPlatillo, OpcionPlatillo } from '../../../../services/administrador/platillos';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interfaz para configuración de columnas
interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'status' | 'currency' | 'image' | 'time' | 'badge';
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
  selector: 'app-platillos-general',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './platillos-general.html',
  styleUrl: './platillos-general.css',
})
export class PlatillosGeneral implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() id_item_seleccionado = new EventEmitter<any>();
  @Output() destino = new EventEmitter<string>();

  @Input() tab: string = "platillos";

  // Datos y estado de la tabla
  tableData: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];
  loading: boolean = false;
  error: string = '';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Búsqueda
  searchTerm: string = '';

  // Configuraciones para cada pestaña
  tableConfigs: { [key: string]: TableConfig } = {
    platillos: {
      loadDataMethod: 'getAllPlatillos',
      columns: [
        { key: 'Ruta_imagen', label: 'Imagen', type: 'image' },
        { key: 'Nombre_platillo', label: 'Nombre del Platillo', type: 'text' },
        { key: 'Descripcion', label: 'Descripción', type: 'text' },
        {
          key: 'precio_venta',
          label: 'Precio',
          type: 'currency',
          format: (value: number) => this.platillosService.formatPrecio(value)
        },
        {
          key: 'tiempo_preparacion',
          label: 'Tiempo Prep.',
          type: 'time',
          format: (value: number) => value ? this.platillosService.formatTiempoPreparacion(value) : '—'
        },
        {
          key: 'En_oferta',
          label: 'Oferta',
          type: 'badge',
          format: (value: boolean) => value ? 'En Oferta' : 'Normal'
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
      actions: { edit: true, view: true }
    },
    tipos: {
      loadDataMethod: 'getAllTiposPlatillo',
      columns: [
        { key: 'ruta_icono', label: 'Icono', type: 'image' },
        { key: 'descripcion', label: 'Descripción', type: 'text' },
        {
          key: 'color',
          label: 'Color',
          type: 'text',
          format: (value: string) => value || '—'
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
    opciones: {
      loadDataMethod: 'getAllPlatillos',
      columns: [
        { key: 'opcion', label: 'Opción', type: 'text' },
        { key: 'Nombre_platillo', label: 'Platillo', type: 'text' },
        {
          key: 'precio',
          label: 'Precio Adicional',
          type: 'currency',
          format: (value: number) => this.platillosService.formatPrecio(value)
        }
      ],
      itemsPerPage: 10,
      showActions: true,
      actions: { edit: true, delete: true }
    }
  };

  constructor(
    private platillosService: PlatillosService,
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
      case "platillos":
        return item.id_platillo || item.__id_platillo__;
      case "tipos":
        return item.id_tipo_platillo || item.__id_tipo_platillo__;
      case "opciones":
        return item.id_option || item.__id_option__;
      default:
        console.error("Tab desconocido:", tab);
        return null;
    }
  }

  // Obtiene la configuración actual según la pestaña activa
  get currentConfig(): TableConfig {
    return this.tableConfigs[this.tab] || this.tableConfigs['platillos'];
  }

  // Cargar datos usando el servicio
  loadTableData(): void {
    this.loading = true;
    this.error = '';
    const config = this.currentConfig;
    const methodName = config.loadDataMethod as keyof PlatillosService;

    // Llamada dinámica al método del servicio
    const serviceMethod = this.platillosService[methodName] as Function;

    if (typeof serviceMethod === 'function') {
      serviceMethod.call(this.platillosService)
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

    if (column.type === 'currency' && value !== null && value !== undefined) {
      return this.platillosService.formatPrecio(value);
    }

    if (column.type === 'time' && value) {
      return this.platillosService.formatTiempoPreparacion(value);
    }

    return value !== null && value !== undefined ? value.toString() : '—';
  }

  // Obtener clase de badge para estado
  getStatusClass(item: any, column: ColumnConfig): string {
    const value = item[column.key];

    if (column.key === 'estatus') {
      return value === true ? 'badge-activo' : 'badge-inactivo';
    }

    if (column.key === 'En_oferta') {
      return value === true ? 'badge-oferta' : 'badge-normal';
    }

    return 'badge-default';
  }
  getImageUrl(item: any, column: ColumnConfig): string {
    const rutaImagen = item[column.key];

    const defaultImg = 'profiles/maquin_de_apoyo.jpeg';

    // Si no viene nada
    if (!rutaImagen) return defaultImg;

    // Si ya es una URL completa
    const url = rutaImagen.startsWith('http')
      ? rutaImagen
      : `${this.platillosService['API_BASE']}/${rutaImagen}`;

    // Verificar si la imagen existe cargándola en memoria
    const img = new Image();
    img.src = url;

    // Si falla, devuelve default
    img.onerror = () => img.src = defaultImg;

    return img.src;
  }


  // Obtener color (para tipos de platillo)
  getColorStyle(item: any): any {
    if (item.color) {
      return {
        'background-color': item.color,
        'width': '30px',
        'height': '30px',
        'border-radius': '5px',
        'display': 'inline-block',
        'border': '1px solid #ddd'
      };
    }
    return {};
  }

  // Verificar si la columna es de tipo imagen
  isImageColumn(column: ColumnConfig): boolean {
    return column.type === 'image';
  }

  // Obtener ID del item
  getItemId(item: any): string | number {
    return item.__id_platillo__ ||
      item.__id_tipo_platillo__ ||
      item.__id_option__ ||
      item.id_platillo ||
      item.id_tipo_platillo ||
      item.id_option ||
      item.id ||
      '';
  }

  // Acciones
  onEdit(id: string | number, destino: string): void {
    this.id_item_seleccionado.emit(id);
    this.destino.emit(destino);
    console.log('Editar:', id, destino);
  }

  onView(id: string | number): void {
    this.id_item_seleccionado.emit(id);
    this.destino.emit('ver_' + this.tab);
    console.log('Ver:', id);
  }

  onAgregar(tipo_agregar: string): void {
    let destino = "agregar_" + tipo_agregar;
    this.destino.emit(destino);
  }

  onDelete(item: any): void {
    const id = this.getItemId(item);
    const nombre = item.Nombre_platillo || item.descripcion || item.opcion || 'este elemento';

    if (confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
      this.loading = true;

      // Llamada al servicio de eliminación según la pestaña
      let deleteMethod: any;

      switch (this.tab) {
        case 'platillos':
          // No hay endpoint de delete para platillos, usar update con estatus false
          deleteMethod = this.platillosService.updatePlatillo(id as string, { estatus: false });
          break;
        case 'tipos':
          deleteMethod = this.platillosService.deleteTipoPlatillo(id as number);
          break;
        case 'opciones':
          deleteMethod = this.platillosService.deleteOpcionPlatillo(id as number);
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

  // Obtener título de la tabla según la pestaña
  getTituloTabla(): string {
    switch (this.tab) {
      case 'platillos':
        return 'Lista de Platillos';
      case 'tipos':
        return 'Tipos de Platillos';
      case 'opciones':
        return 'Opciones de Personalización';
      default:
        return 'Gestión de Platillos';
    }
  }

  // Obtener texto del botón agregar
  getTextoAgregar(): string {
    switch (this.tab) {
      case 'platillos':
        return 'Agregar Platillo';
      case 'tipos':
        return 'Agregar Tipo';
      case 'opciones':
        return 'Agregar Opción';
      default:
        return 'Agregar';
    }
  }
}