import { Component, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MesasService, Mesa } from '../../../../services/administrador/mesas';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interfaz para configuración de columnas
interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'estado' | 'pedido';
  format?: (value: any) => string;
  visible?: boolean;
}

@Component({
  selector: 'app-mesas-general',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './mesas-general.html',
  styleUrl: './mesas-general.css',
})
export class MesasGeneral implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() id_mesa_seleccionada = new EventEmitter<any>();
  @Output() destino = new EventEmitter<string>();

  // Datos y estado de la tabla
  tableData: Mesa[] = [];
  filteredData: Mesa[] = [];
  paginatedData: Mesa[] = [];
  loading: boolean = false;
  error: string = '';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 15;
  totalPages: number = 1;

  // Búsqueda
  searchTerm: string = '';

  // Filtro de estado
  filtroEstado: string = 'todas';

  // Configuración de columnas
  columns: ColumnConfig[] = [
    { key: 'Nombre_mesa', label: 'Mesa', type: 'text' },
    { key: 'Capacidad', label: 'Capacidad', type: 'number' },
    {
      key: 'Estado',
      label: 'Estado',
      type: 'estado',
      format: (value: string) => value || 'Desconocido'
    },
    {
      key: 'id_pedido',
      label: 'Pedido Activo',
      type: 'pedido',
      format: (value: string | null) => value ? 'Sí' : 'No'
    },
    {
      key: 'estatus_bool',
      label: 'Activa',
      type: 'estado',
      format: (value: boolean) => value === true ? 'Activa' : 'Inactiva'
    }
  ];

  constructor(
    private mesasService: MesasService,
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

    this.mesasService.getAllMesas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Mesa[]) => {
          // Filtrar solo mesas activas
          this.tableData = data;
          this.applyFilters();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: Error) => {
          console.error('Error cargando mesas:', error);
          this.error = error.message;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Aplicar filtros y búsqueda
  applyFilters(): void {
    let filtered = [...this.tableData];

    // Filtro por estado
    if (this.filtroEstado !== 'todas') {
      filtered = filtered.filter(item => item.Estado === this.filtroEstado);
    }

    // Búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        return this.columns.some(col => {
          let value = item[col.key as keyof Mesa];
          return value && value.toString().toLowerCase().includes(term);
        });
      });
    }

    this.filteredData = filtered;
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    this.currentPage = 1; // Reset a página 1 cuando se filtran
    this.updatePaginatedData();
  }

  // Actualizar datos paginados
  updatePaginatedData(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  // Formatear valor de celda
  formatCellValue(item: Mesa, column: ColumnConfig): string {
    const value = item[column.key as keyof Mesa];

    if (column.format) {
      return column.format(value);
    }

    return value !== null && value !== undefined ? value.toString() : '—';
  }

  // Obtener clase de badge para estado
  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'Libre': 'badge-libre',
      'Ocupada': 'badge-ocupada',
      'Reservada': 'badge-reservada'
    };
    return clases[estado] || 'badge-default';
  }

  // Obtener clase de badge para pedido
  getPedidoClass(tienePedido: boolean): string {
    return tienePedido ? 'badge-pedido-si' : 'badge-pedido-no';
  }

  // Acciones
  onEdit(id_mesa: string): void {
    this.id_mesa_seleccionada.emit(id_mesa);
    this.destino.emit('editar_mesa');
    console.log(id_mesa, 'editar_mesa');
  }

  onView(id_mesa: string): void {
    this.id_mesa_seleccionada.emit(id_mesa);
    this.destino.emit('ver_mesa');
    console.log(id_mesa, 'ver_mesa');
  }

  onAgregar(): void {
    this.destino.emit('agregar_mesa');
  }

  // Búsqueda
  onSearch(): void {
    this.applyFilters();
  }

  // Cambiar filtro de estado
  onFiltroEstadoChange(): void {
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

  // Contadores para estadísticas
  get totalMesas(): number {
    return this.tableData.length;
  }

  get mesasLibres(): number {
    return this.tableData.filter(m => m.Estado === 'Libre').length;
  }

  get mesasOcupadas(): number {
    return this.tableData.filter(m => m.Estado === 'Ocupada').length;
  }

  get mesasReservadas(): number {
    return this.tableData.filter(m => m.Estado === 'Reservada').length;
  }
}