import { Component, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CombosService, Combo } from '../../../../services/administrador/combos';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'number' | 'badge' | 'image';
  format?: (value: any) => string;
  visible?: boolean;
}

interface TableConfig {
  columns: ColumnConfig[];
  itemsPerPage?: number;
  showActions?: boolean;
  actions?: {
    edit?: boolean;
    delete?: boolean;
    view?: boolean;
  };
}

@Component({
  selector: 'app-combos-general',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './combos-general.html',
  styleUrl: './combos-general.css',
})
export class CombosGeneral implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() id_item_seleccionado = new EventEmitter<any>();
  @Output() destino = new EventEmitter<string>();

  tableData: Combo[] = [];
  filteredData: Combo[] = [];
  paginatedData: Combo[] = [];
  loading: boolean = false;
  error: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  searchTerm: string = '';

  tableConfig: TableConfig = {
    columns: [
      {
        key: 'Ruta_imagen',
        label: 'Imagen',
        type: 'image'
      },
      {
        key: 'Nombre_combo',
        label: 'Nombre del Combo',
        type: 'text'
      },
      {
        key: 'Descripcion',
        label: 'Descripción',
        type: 'text'
      },
      {
        key: 'precio_combo',
        label: 'Precio',
        type: 'currency',
        format: (value: number) => this.combosService.formatPrecio(value)
      },
      {
        key: 'estatus',
        label: 'Estatus',
        type: 'badge'
      }
    ],
    itemsPerPage: 10,
    showActions: true,
    actions: { edit: true, view: true, delete: true }
  };

  constructor(
    private combosService: CombosService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadTableData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTableData(): void {
    this.loading = true;
    this.error = '';

    this.combosService.getAllCombos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Combo[]) => {
          this.tableData = data;
          this.applyFilters();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: Error) => {
          console.error('Error cargando combos:', error);
          this.error = error.message;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.tableData];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        if (item.Nombre_combo?.toLowerCase().includes(term)) {
          return true;
        }
        if (item.Descripcion?.toLowerCase().includes(term)) {
          return true;
        }
        if (item.precio_combo?.toString().includes(term)) {
          return true;
        }
        if (item.platillos && Array.isArray(item.platillos)) {
          return item.platillos.some(p =>
            p.Nombre_platillo?.toLowerCase().includes(term)
          );
        }
        return false;
      });
    }

    this.filteredData = filtered;
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  formatCellValue(item: Combo, column: ColumnConfig): string {
    const value = item[column.key as keyof Combo];

    if (column.format) {
      return column.format(value);
    }

    if (column.type === 'currency' && value !== null && value !== undefined) {
      return this.combosService.formatPrecio(value as number);
    }

    return value !== null && value !== undefined ? value.toString() : '—';
  }

  getImageUrl(item: Combo): string {
    return this.combosService.getImageUrl(item.Ruta_imagen);
  }

  getEstatusTexto(item: Combo): string {
    return this.combosService.getEstatusTexto(item.estatus);
  }

  getEstatusClass(item: Combo): string {
    return this.combosService.getEstatusClass(item.estatus);
  }

  getItemId(item: Combo): string {
    return item.id_combo;
  }

  onEdit(id: string): void {
    this.id_item_seleccionado.emit(id);
    this.destino.emit('editar_combo');
    console.log('Editar combo:', id);
  }

  onView(id: string): void {
    this.id_item_seleccionado.emit(id);
    this.destino.emit('ver_combo');
    console.log('Ver combo:', id);
  }

  onAgregar(): void {
    this.destino.emit('agregar_combo');
  }

  onDelete(item: Combo): void {
    const id = this.getItemId(item);
    const nombre = item.Nombre_combo || 'este combo';

    if (confirm(`¿Estás seguro de eliminar el combo "${nombre}"?\n\nEsto eliminará también todos los platillos asociados.`)) {
      this.loading = true;

      this.combosService.deleteAllComboDetalle(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Combo eliminado correctamente');
            this.loadTableData();
          },
          error: (error: Error) => {
            console.error('Error al eliminar combo:', error);
            alert('Error al eliminar: ' + error.message);
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

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

  getTituloTabla(): string {
    return 'Lista de Combos';
  }

  getTextoAgregar(): string {
    return 'Agregar Combo';
  }
}