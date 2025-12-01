import { Component, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UsuariosService, Usuario } from '../../../../services/administrador/usuarios';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interfaz para configuración de columnas
interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'status' | 'nivel';
  format?: (value: any) => string;
  visible?: boolean;
}

@Component({
  selector: 'app-usuarios-general',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './usuarios-general.html',
  styleUrl: './usuarios-general.css',
})
export class UsuariosGeneral implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() id_usuario_seleccionado = new EventEmitter<any>();
  @Output() destino = new EventEmitter<string>();

  // Datos y estado de la tabla
  tableData: Usuario[] = [];
  filteredData: Usuario[] = [];
  paginatedData: Usuario[] = [];
  loading: boolean = false;
  error: string = '';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 15;
  totalPages: number = 1;

  // Búsqueda
  searchTerm: string = '';

  // Mapeo de niveles de usuario
  nivelesUsuario: { [key: number]: string } = {
    1: 'Cliente',
    2: 'Mesero',
    3: 'Cocinero',
    4: 'Cajero',
    5: 'Repartidor',
    6: 'Administrador',
    7: 'Genérico',
    8: 'Temporal'
  };

  // Configuración de columnas
  columns: ColumnConfig[] = [
    { key: 'Nickname', label: 'Usuario', type: 'text' },
    { key: 'Nombre', label: 'Nombre', type: 'text' },
    { key: 'Correo_electronico', label: 'Correo', type: 'text' },
    {
      key: 'id_nvl_usuario',
      label: 'Nivel',
      type: 'nivel',
      format: (value: number) => this.nivelesUsuario[value] || 'Desconocido'
    },
    { key: 'Num_telefonico', label: 'Teléfono', type: 'text' },
    {
      key: 'estatus',
      label: 'Estado',
      type: 'status',
      format: (value: boolean) => value === true ? 'Activo' : 'Inactivo'
    }
  ];

  constructor(
    private usuariosService: UsuariosService,
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

    this.usuariosService.getAllUsuarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Usuario[]) => {
          this.tableData = data.filter(usuario => usuario.id_nvl_usuario !== 7 && usuario.id_nvl_usuario !== 8);
          this.applyFilters();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: Error) => {
          console.error('Error cargando usuarios:', error);
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
          let value = item[col.key as keyof Usuario];

          // Para el nivel de usuario, buscar en la descripción
          if (col.key === 'id_nvl_usuario' && typeof value === 'number') {
            value = this.nivelesUsuario[value];
          }

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
  formatCellValue(item: Usuario, column: ColumnConfig): string {
    const value = item[column.key as keyof Usuario];

    if (column.format) {
      return column.format(value);
    }

    if (column.type === 'nivel' && typeof value === 'number') {
      return this.nivelesUsuario[value] || 'Desconocido';
    }

    return value !== null && value !== undefined ? value.toString() : '—';
  }

  // Obtener clase de badge para estado
  getStatusClass(item: Usuario, column: ColumnConfig): string {
    const value = item[column.key as keyof Usuario];
    return value === true ? 'badge-activo' : 'badge-inactivo';
  }

  // Obtener clase de badge para nivel de usuario
  getNivelClass(idNivel: number): string {
    const clases: { [key: number]: string } = {
      1: 'badge-cliente',
      2: 'badge-mesero',
      3: 'badge-cocinero',
      4: 'badge-cajero',
      5: 'badge-repartidor',
      6: 'badge-admin',
      7: 'badge-generico',
      8: 'badge-temporal'
    };
    return clases[idNivel] || 'badge-default';
  }

  // Acciones
  onEdit(id_usuario: string): void {
    this.id_usuario_seleccionado.emit(id_usuario);
    this.destino.emit('usuarios');
    console.log(id_usuario, 'usuarios');
  }

  onAgregar(): void {
    this.destino.emit('agregar_usuarios');
  }

  onDelete(item: Usuario): void {
    if (confirm(`¿Estás seguro de eliminar al usuario ${item.Nickname}?`)) {
      this.loading = true;

      this.usuariosService.deleteUsuario(item.id_usuario!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Usuario eliminado correctamente');
            this.loadTableData();
          },
          error: (error: Error) => {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar: ' + error.message);
            this.loading = false;
          }
        });
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