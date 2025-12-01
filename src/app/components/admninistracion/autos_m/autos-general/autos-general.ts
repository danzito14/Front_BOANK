import { Component, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AutomovilesService, Automovil } from '../../../../services/administrador/automoviles';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interfaz para configuración de columnas
interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'estado' | 'year';
  format?: (value: any) => string;
  visible?: boolean;
}

@Component({
  selector: 'app-automoviles-general',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './autos-general.html',
  styleUrl: './autos-general.css',
})
export class AutomovilesGeneral implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() id_automovil_seleccionado = new EventEmitter<any>();
  @Output() destino = new EventEmitter<string>();

  // Datos y estado de la tabla
  tableData: Automovil[] = [];
  filteredData: Automovil[] = [];
  paginatedData: Automovil[] = [];
  loading: boolean = false;
  error: string = '';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 15;
  totalPages: number = 1;

  // Búsqueda
  searchTerm: string = '';

  // Configuración de columnas
  columns: ColumnConfig[] = [
    { key: 'apodo', label: 'Apodo', type: 'text' },
    { key: 'Marca', label: 'Marca', type: 'text' },
    { key: 'Modelo', label: 'Modelo', type: 'text' },
    { key: 'Año', label: 'Año', type: 'year' },
    { key: 'Placas', label: 'Placas', type: 'text' },
    { key: 'Color', label: 'Color', type: 'text' },
    {
      key: 'Estado',
      label: 'Estado',
      type: 'estado',
      format: (value: string) => value || 'Desconocido'
    },
    {
      key: 'Fecha_compra',
      label: 'Fecha Compra',
      type: 'date',
      format: (value: string) => this.formatDate(value)
    }
  ];

  constructor(
    private automovilesService: AutomovilesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadTableData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Cargar datos usando el servicio
  loadTableData(): void {
    this.loading = true;
    this.error = '';

    this.automovilesService.getAllAutomoviles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Automovil[]) => {
          this.tableData = data;
          this.applyFilters();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: Error) => {
          console.error('Error cargando automóviles:', error);
          this.error = error.message;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Aplicar filtros y búsqueda
  applyFilters(): void {
    let filtered = [...this.tableData];

    // Búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        return this.columns.some(col => {
          let value = item[col.key as keyof Automovil];
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
  formatCellValue(item: Automovil, column: ColumnConfig): string {
    const value = item[column.key as keyof Automovil];

    if (column.format) {
      return column.format(value);
    }

    return value !== null && value !== undefined ? value.toString() : '—';
  }

  // Formatear fecha
  formatDate(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  }

  // Obtener clase de badge para estado
  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'Activo': 'badge-activo',
      'En mantenimiento': 'badge-mantenimiento',
      'Baja': 'badge-baja'
    };
    return clases[estado] || 'badge-default';
  }

  // Acciones
  onEdit(id_auto: string): void {
    this.id_automovil_seleccionado.emit(id_auto);
    this.destino.emit('editar_automovil');
    console.log(id_auto, 'editar_automovil');
  }

  onAgregar(): void {
    this.destino.emit('agregar_automovil');
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