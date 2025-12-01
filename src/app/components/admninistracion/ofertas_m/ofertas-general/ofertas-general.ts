import { Component, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { OfertasService, Oferta, OfertaCompleta } from '../../../../services/administrador/ofertas';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'number' | 'badge' | 'date' | 'percent';
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
  selector: 'app-ofertas-general',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './ofertas-general.html',
  styleUrls: ['./ofertas-general.css'],
})
export class OfertasGeneral implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() id_item_seleccionado = new EventEmitter<any>();
  @Output() destino = new EventEmitter<string>();

  tableData: OfertaCompleta[] = [];
  filteredData: OfertaCompleta[] = [];
  paginatedData: OfertaCompleta[] = [];
  loading: boolean = false;
  error: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  searchTerm: string = '';

  tableConfig: TableConfig = {
    columns: [
      {
        key: 'nombre_oferta',
        label: 'Nombre de Oferta',
        type: 'text'
      },
      {
        key: 'descripcion',
        label: 'Descripción',
        type: 'text'
      },
      {
        key: 'porcentaje_descuento',
        label: 'Descuento',
        type: 'percent',
        format: (value: number) => this.ofertasService.formatDescuento(value)
      },
      {
        key: 'fecha_inicio',
        label: 'Fecha Inicio',
        type: 'date',
        format: (value: string) => this.ofertasService.formatFecha(value)
      },
      {
        key: 'fecha_fin',
        label: 'Fecha Fin',
        type: 'date',
        format: (value: string) => this.ofertasService.formatFecha(value)
      },
      {
        key: 'total_platillos',
        label: 'Platillos',
        type: 'number'
      },
      {
        key: 'activo',
        label: 'Estado',
        type: 'badge'
      }
    ],
    itemsPerPage: 10,
    showActions: true,
    actions: { edit: true, view: true, delete: true }
  };

  constructor(
    private ofertasService: OfertasService,
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

    // Cargar ofertas y sus platillos
    this.ofertasService.getAllOfertas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ofertas: Oferta[]) => {
          // Para cada oferta, cargar sus platillos
          const platillosRequests = ofertas.map(oferta =>
            this.ofertasService.getPlatillosByOferta(oferta.id_oferta)
          );

          if (platillosRequests.length === 0) {
            this.tableData = [];
            this.applyFilters();
            this.loading = false;
            this.cdr.detectChanges();
            return;
          }

          forkJoin(platillosRequests)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (platillosArrays) => {
                // Combinar ofertas con sus platillos
                this.tableData = ofertas.map((oferta, index) => ({
                  ...oferta,
                  platillos: platillosArrays[index] || [],
                  total_platillos: platillosArrays[index]?.length || 0
                }));

                this.applyFilters();
                this.loading = false;
                this.cdr.detectChanges();
              },
              error: (error: Error) => {
                console.error('Error cargando platillos:', error);
                // Mostrar ofertas sin platillos
                this.tableData = ofertas.map(oferta => ({
                  ...oferta,
                  platillos: [],
                  total_platillos: 0
                }));
                this.applyFilters();
                this.loading = false;
                this.cdr.detectChanges();
              }
            });
        },
        error: (error: Error) => {
          console.error('Error cargando ofertas:', error);
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
        // Buscar en nombre de oferta
        if (item.nombre_oferta?.toLowerCase().includes(term)) {
          return true;
        }
        // Buscar en descripción
        if (item.descripcion?.toLowerCase().includes(term)) {
          return true;
        }
        // Buscar en descuento
        if (item.porcentaje_descuento?.toString().includes(term)) {
          return true;
        }
        // Buscar en estado
        const estadoTexto = this.getEstatusTexto(item);
        if (estadoTexto.toLowerCase().includes(term)) {
          return true;
        }
        return false;
      });
    }

    this.filteredData = filtered;
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    this.currentPage = 1; // Reset a primera página
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  formatCellValue(item: OfertaCompleta, column: ColumnConfig): string {
    const value = item[column.key as keyof OfertaCompleta];

    if (column.format) {
      return column.format(value);
    }

    if (column.type === 'percent' && value !== null && value !== undefined) {
      return this.ofertasService.formatDescuento(value as number);
    }

    if (column.type === 'date' && value !== null && value !== undefined) {
      return this.ofertasService.formatFecha(value as string);
    }

    if (column.type === 'number' && value !== null && value !== undefined) {
      return value.toString();
    }

    return value !== null && value !== undefined ? value.toString() : '—';
  }

  getEstatusTexto(item: OfertaCompleta): string {
    return this.ofertasService.getEstatusTexto(item.activo);
  }

  getEstatusClass(item: OfertaCompleta): string {
    return this.ofertasService.getEstatusClass(item.activo);
  }

  getItemId(item: OfertaCompleta): string {
    return item.id_oferta;
  }

  isOfertaVigente(item: OfertaCompleta): boolean {
    return this.ofertasService.isOfertaVigente(item);
  }

  onEdit(id: string): void {
    this.id_item_seleccionado.emit(id);
    this.destino.emit('editar_oferta');
    console.log('Editar oferta:', id);
  }

  onView(id: string): void {
    this.id_item_seleccionado.emit(id);
    this.destino.emit('ver_oferta');
    console.log('Ver oferta:', id);
  }

  onAgregar(): void {
    this.destino.emit('agregar_oferta');
  }

  async onDelete(item: OfertaCompleta): Promise<void> {
    const id = this.getItemId(item);
    const nombreOferta = item.nombre_oferta || 'esta oferta';
    const tienePlatillos = item.total_platillos && item.total_platillos > 0;

    const confirmacion = await Swal.fire({
      title: '¿Eliminar oferta?',
      html: `
        <p>¿Estás seguro de eliminar la oferta <strong>"${nombreOferta}"</strong>?</p>
        ${tienePlatillos ? `<p class="warning-text">Esta oferta tiene ${item.total_platillos} platillo(s) asociado(s) que también serán eliminados.</p>` : ''}
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#773832',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.loading = true;

    try {
      // Primero eliminar todos los platillos asociados
      if (tienePlatillos) {
        await this.ofertasService.deleteAllPlatillosOferta(id).toPromise();
      }

      // Luego actualizar la oferta a inactiva (activo = 0 o false)
      await this.ofertasService.updateOferta(id, { activo: 0 }).toPromise();

      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'La oferta se eliminó correctamente',
        confirmButtonColor: '#d4af37'
      });

      this.loadTableData();
    } catch (error: any) {
      console.error('Error al eliminar oferta:', error);
      this.loading = false;
      this.cdr.detectChanges();

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo eliminar la oferta: ${error.message}`,
        confirmButtonColor: '#773832'
      });
    }
  }

  onSearch(): void {
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
    return 'Lista de Ofertas';
  }

  getTextoAgregar(): string {
    return 'Agregar Oferta';
  }
}