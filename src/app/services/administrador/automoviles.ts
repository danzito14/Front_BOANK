import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces
export interface Automovil {
  id_auto?: string;
  Marca: string;
  Modelo: string;
  Año: number;
  Placas: string;
  Color: string;
  Fecha_compra: string;
  Estado: 'Activo' | 'En mantenimiento' | 'Baja';
  id_empleado?: string;
  apodo: string;
}

export interface AutomovilSchema {
  Marca: string;
  Modelo: string;
  Año: number;
  Placas: string;
  Color: string;
  Fecha_compra?: string;
  Estado: 'Activo' | 'En mantenimiento' | 'Baja';
  id_empleado?: string;
  apodo: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutomovilesService {
  private API_BASE = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ==================== CRUD AUTOMÓVILES ====================

  /**
   * Crear nuevo automóvil
   */
  createAutomovil(data: AutomovilSchema): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_BASE}/automovil/create_automovil`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener todos los automóviles
   */
  getAllAutomoviles(): Observable<Automovil[]> {
    return this.http.get<Automovil[]>(
      `${this.API_BASE}/automovil/get_all_automovil`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener automóvil por apodo
   */
  getAutomovilByApodo(apodo: string): Observable<Automovil> {
    return this.http.get<Automovil>(
      `${this.API_BASE}/automovil/get_automovil/${apodo}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener automóvil por ID
   */
  getAutomovilById(idAuto: string): Observable<Automovil> {
    return new Observable(observer => {
      this.getAllAutomoviles().subscribe({
        next: (automoviles) => {
          const automovil = automoviles.find(a => a.id_auto === idAuto);
          if (automovil) {
            observer.next(automovil);
            observer.complete();
          } else {
            observer.error(new Error('Automóvil no encontrado'));
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Actualizar automóvil
   */
  updateAutomovil(idAuto: string, data: Partial<AutomovilSchema>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.API_BASE}/automovil/update_automovil/${idAuto}`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatear fecha
   */
  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  }

  /**
   * Formatear fecha para input date
   */
  formatDateForInput(fecha: string | null | undefined): string {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  /**
   * Obtener texto del estado
   */
  getEstadoTexto(estado: string): string {
    return estado || 'Desconocido';
  }

  /**
   * Obtener clase CSS del estado
   */
  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'Activo': 'badge-activo',
      'En mantenimiento': 'badge-mantenimiento',
      'Baja': 'badge-baja'
    };
    return clases[estado] || 'badge-default';
  }

  /**
   * Validar placas (formato mexicano básico)
   */
  validarPlacas(placas: string): { valid: boolean; error?: string } {
    if (!placas || placas.length === 0) {
      return { valid: false, error: 'Las placas son requeridas' };
    }

    // Formato básico: 3 letras + 4 números (puede variar por estado)
    const formatoBasico = /^[A-Z]{3}\d{4}$/i;

    if (placas.length < 6 || placas.length > 10) {
      return { valid: false, error: 'Las placas deben tener entre 6 y 10 caracteres' };
    }

    return { valid: true };
  }

  /**
   * Validar año del automóvil
   */
  validarAño(año: number): { valid: boolean; error?: string } {
    const añoActual = new Date().getFullYear();
    const añoMinimo = 1900;

    if (año < añoMinimo) {
      return { valid: false, error: `El año debe ser mayor a ${añoMinimo}` };
    }

    if (año > añoActual + 1) {
      return { valid: false, error: `El año no puede ser mayor a ${añoActual + 1}` };
    }

    return { valid: true };
  }

  /**
   * Calcular antigüedad del vehículo
   */
  calcularAntiguedad(año: number): number {
    const añoActual = new Date().getFullYear();
    return añoActual - año;
  }

  /**
   * Verificar si el automóvil está disponible
   */
  isDisponible(automovil: Automovil): boolean {
    return automovil.Estado === 'Activo';
  }

  /**
   * Verificar si el automóvil necesita mantenimiento (antigüedad > 10 años)
   */
  necesitaMantenimiento(automovil: Automovil): boolean {
    return this.calcularAntiguedad(automovil.Año) > 10 || automovil.Estado === 'En mantenimiento';
  }

  /**
   * Obtener estadísticas de automóviles
   */
  getEstadisticas(automoviles: Automovil[]): {
    total: number;
    activos: number;
    enMantenimiento: number;
    baja: number;
    promedioAntiguedad: number;
  } {
    const total = automoviles.length;
    const activos = automoviles.filter(a => a.Estado === 'Activo').length;
    const enMantenimiento = automoviles.filter(a => a.Estado === 'En mantenimiento').length;
    const baja = automoviles.filter(a => a.Estado === 'Baja').length;

    const sumaAntiguedad = automoviles.reduce((sum, a) => sum + this.calcularAntiguedad(a.Año), 0);
    const promedioAntiguedad = total > 0 ? Math.round(sumaAntiguedad / total) : 0;

    return {
      total,
      activos,
      enMantenimiento,
      baja,
      promedioAntiguedad
    };
  }

  /**
   * Filtrar automóviles por estado
   */
  filtrarPorEstado(automoviles: Automovil[], estado: string): Automovil[] {
    return automoviles.filter(a => a.Estado === estado);
  }

  /**
   * Buscar automóviles por término
   */
  buscarAutomoviles(automoviles: Automovil[], termino: string): Automovil[] {
    const term = termino.toLowerCase().trim();
    if (!term) return automoviles;

    return automoviles.filter(a =>
      a.apodo.toLowerCase().includes(term) ||
      a.Marca.toLowerCase().includes(term) ||
      a.Modelo.toLowerCase().includes(term) ||
      a.Placas.toLowerCase().includes(term) ||
      a.Color.toLowerCase().includes(term) ||
      a.Año.toString().includes(term)
    );
  }

  /**
   * Ordenar automóviles
   */
  // ordenarAutomoviles(
  //   automoviles: Automovil[],
  //   campo: keyof Automovil,
  //   orden: 'asc' | 'desc' = 'asc'
  // ): Automovil[] {
  //   return [...automoviles].sort((a, b) => {
  //     const valorA = a[campo];
  //     const valorB = b[campo];

  //     if (valorA === valorB) return 0;

  //     const comparacion = valorA < valorB ? -1 : 1;
  //     return orden === 'asc' ? comparacion : -comparacion;
  //   });
  // }

  /**
   * Manejo de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.detail || `Error ${error.status}: ${error.message}`;
    }

    console.error('Error en AutomovilesService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}