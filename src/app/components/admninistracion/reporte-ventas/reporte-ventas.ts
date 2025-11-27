import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import {
  ReporteExtendidoInterface,
  Reportes,
  PedidoInterface,
  PedidosResponseInterface,
  ChartDataInterface,
  PlatilloRentableInterface
} from '../../../services/administrador/reportes';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);


@Component({
  selector: 'app-reporte-ventas',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './reporte-ventas.html',
  styleUrl: './reporte-ventas.css',
})
export class ReporteVentasl implements OnInit, OnDestroy, AfterViewInit {
  tab: string = "hoy";

  // Variables para selector de fechas
  fechaInicio: string = '';
  fechaFin: string = '';
  fechaMaxima: string = '';

  // Datos animados para las tarjetas
  animPrep = 0;
  animCanc = 0;
  animTot = 0;
  animIng = 0;
  animEgr = 0;
  animGan = 0;
  animPerd = 0; // Pérdidas por cancelación

  // NUEVAS MÉTRICAS ANIMADAS
  animTicket = 0;
  animTasaCanc = 0;
  animPlatPedido = 0;
  animPedidosTotal = 0;
  animPedidosComp = 0;
  animPedidosCanc = 0;

  // Datos del reporte
  animNum: ReporteExtendidoInterface | null = null;

  // Platillo más rentable
  platilloRentable: PlatilloRentableInterface | null = null;

  // Datos de pedidos con paginación
  pedidos: PedidoInterface[] = [];
  currentPage = 1;
  totalPages = 1;
  totalPedidos = 0;
  itemsPerPage = 50;

  // Datos para gráficas
  chartData: ChartDataInterface | null = null;

  // Referencias a los canvas de las gráficas
  @ViewChild('chartVentas') chartVentasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDistribucion') chartDistribucionRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPlatillos') chartPlatillosRef!: ElementRef<HTMLCanvasElement>;

  // Instancias de los charts
  private chartVentas?: Chart;
  private chartDistribucion?: Chart;
  private chartPlatillos?: Chart;

  // Array para limpiar los intervalos
  private intervalos: any[] = [];

  // Loading states
  isLoadingReport = false;
  isLoadingPedidos = false;
  isLoadingCharts = false;

  constructor(
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
    private ReportesService: Reportes
  ) { }

  ngOnInit() {
    // Establecer fecha máxima como hoy
    const hoy = new Date();
    this.fechaMaxima = hoy.toISOString().split('T')[0];

  }

  ngAfterViewInit() {
    this.cargar_datos(this.tab);
    // Los charts se crearán cuando tengamos datos
  }

  ngOnDestroy() {
    this.intervalos.forEach(intervalo => clearInterval(intervalo));
    this.destruirCharts();
  }

  destruirCharts() {
    if (this.chartVentas) {
      this.chartVentas.destroy();
    }
    if (this.chartDistribucion) {
      this.chartDistribucion.destroy();
    }
    if (this.chartPlatillos) {
      this.chartPlatillos.destroy();
    }
  }

  animarNumero(valorFinal: number, callback: (v: number) => void) {
    let inicio = 0;
    const duracion = 800;
    const fps = 30;
    const pasos = duracion / (1000 / fps);
    const incremento = valorFinal / pasos;

    const intervalo = setInterval(() => {
      inicio += incremento;
      if (inicio >= valorFinal) {
        callback(Math.round(valorFinal));
        clearInterval(intervalo);
        const index = this.intervalos.indexOf(intervalo);
        if (index > -1) {
          this.intervalos.splice(index, 1);
        }
      } else {
        callback(Math.floor(inicio));
      }
      this.cd.detectChanges();
    }, 1000 / fps);

    this.intervalos.push(intervalo);
  }

  cargar_datos(intervalo: string) {
    // Limpiar intervalos previos
    this.intervalos.forEach(int => clearInterval(int));
    this.intervalos = [];

    // Resetear valores
    this.resetearValores();

    // Solo cargar si NO es el tab de fecha (que usa cargar_datos_por_fecha)
    if (intervalo === 'fecha') {
      return;
    }

    // Cargar reportes principales
    this.cargar_reporte(intervalo);

    // Cargar pedidos
    this.cargar_pedidos(intervalo, 1);

    // Cargar datos de gráficas
    this.cargar_graficas(intervalo);

    // Cargar platillo más rentable
    this.cargar_platillo_rentable(intervalo);
  }

  cargar_datos_por_fecha() {
    if (!this.fechaInicio || !this.fechaFin) {
      alert('Por favor selecciona ambas fechas');
      return;
    }

    // Validar que fecha inicio sea menor o igual a fecha fin
    if (new Date(this.fechaInicio) > new Date(this.fechaFin)) {
      alert('La fecha de inicio debe ser anterior o igual a la fecha fin');
      return;
    }

    // Limpiar intervalos previos
    this.intervalos.forEach(int => clearInterval(int));
    this.intervalos = [];

    // Resetear valores
    this.resetearValores();

    // Cargar datos con el rango personalizado
    this.cargar_reporte_intervalo(this.fechaInicio, this.fechaFin);
    this.cargar_pedidos_intervalo(this.fechaInicio, this.fechaFin, 1);
    this.cargar_graficas_intervalo(this.fechaInicio, this.fechaFin);
    this.cargar_platillo_rentable_intervalo(this.fechaInicio, this.fechaFin);
  }

  limpiar_fechas() {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.resetearValores();
  }

  formatearFechaLegible(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  calcularDiasRango(): number {
    if (!this.fechaInicio || !this.fechaFin) return 0;

    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    const diferencia = fin.getTime() - inicio.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24)) + 1;
  }

  resetearValores() {
    this.animPrep = 0;
    this.animCanc = 0;
    this.animTot = 0;
    this.animIng = 0;
    this.animEgr = 0;
    this.animGan = 0;
    this.animPerd = 0;
    this.animTicket = 0;
    this.animTasaCanc = 0;
    this.animPlatPedido = 0;
    this.animPedidosTotal = 0;
    this.animPedidosComp = 0;
    this.animPedidosCanc = 0;
  }

  cargar_reporte(intervalo: string) {
    this.isLoadingReport = true;

    const procesarDatos = (data: ReporteExtendidoInterface) => {
      this.animNum = data;
      this.isLoadingReport = false;

      setTimeout(() => {
        this.animarNumero(data.platillos_preparados, (v) => {
          this.animPrep = v;
        });

        this.animarNumero(data.platillos_cancelados, (v) => {
          this.animCanc = v;
        });

        this.animarNumero(data.total_platillos, (v) => {
          this.animTot = v;
        });

        this.animarNumero(data.ingresos_estimados, (v) => {
          this.animIng = v;
        });

        this.animarNumero(data.egresos_estimados, (v) => {
          this.animEgr = v;
        });

        this.animarNumero(data.ganancia_estimada, (v) => {
          this.animGan = v;
        });

        this.animarNumero(data.egresos_cancelados!, (v) => {
          this.animPerd = v;
        });

        // NUEVAS ANIMACIONES
        this.animarNumero(data.ticket_promedio, (v) => {
          this.animTicket = v;
        });

        this.animarNumero(data.tasa_cancelacion, (v) => {
          this.animTasaCanc = v;
        });

        this.animarNumero(data.platillos_por_pedido, (v) => {
          this.animPlatPedido = v;
        });

        this.animarNumero(data.total_pedidos, (v) => {
          this.animPedidosTotal = v;
        });

        this.animarNumero(data.pedidos_completados, (v) => {
          this.animPedidosComp = v;
        });

        this.animarNumero(data.pedidos_cancelados, (v) => {
          this.animPedidosCanc = v;
        });

        this.cd.detectChanges();
      }, 10);
    };

    switch (intervalo) {
      case 'hoy':
        this.ReportesService.get_reporte_ventas_hoy().subscribe({
          next: procesarDatos,
          error: (err) => {
            console.error('Error cargando reporte de hoy:', err);
            this.isLoadingReport = false;
          }
        });
        break;

      case 'semana':
        this.ReportesService.get_reporte_ventas_semana().subscribe({
          next: procesarDatos,
          error: (err) => {
            console.error('Error cargando reporte de semana:', err);
            this.isLoadingReport = false;
          }
        });
        break;

      case 'mes':
        this.ReportesService.get_reporte_ventas_mes().subscribe({
          next: procesarDatos,
          error: (err) => {
            console.error('Error cargando reporte de mes:', err);
            this.isLoadingReport = false;
          }
        });
        break;

      default:
        this.isLoadingReport = false;
        break;
    }
  }

  cargar_reporte_intervalo(inicio: string, fin: string) {
    this.isLoadingReport = true;

    this.ReportesService.get_reporte_ventas_intervalo(inicio, fin).subscribe({
      next: (data: ReporteExtendidoInterface) => {
        this.animNum = data;
        this.isLoadingReport = false;

        setTimeout(() => {
          this.animarNumero(data.platillos_preparados, (v) => { this.animPrep = v; });
          this.animarNumero(data.platillos_cancelados, (v) => { this.animCanc = v; });
          this.animarNumero(data.total_platillos, (v) => { this.animTot = v; });
          this.animarNumero(data.ingresos_estimados, (v) => { this.animIng = v; });
          this.animarNumero(data.egresos_estimados, (v) => { this.animEgr = v; });
          this.animarNumero(data.ganancia_estimada, (v) => { this.animGan = v; });
          this.animarNumero(data.egresos_cancelados!, (v) => { this.animPerd = v; });
          this.animarNumero(data.ticket_promedio, (v) => { this.animTicket = v; });
          this.animarNumero(data.tasa_cancelacion, (v) => { this.animTasaCanc = v; });
          this.animarNumero(data.platillos_por_pedido, (v) => { this.animPlatPedido = v; });
          this.animarNumero(data.total_pedidos, (v) => { this.animPedidosTotal = v; });
          this.animarNumero(data.pedidos_completados, (v) => { this.animPedidosComp = v; });
          this.animarNumero(data.pedidos_cancelados, (v) => { this.animPedidosCanc = v; });
          this.cd.detectChanges();
        }, 10);
      },
      error: (err) => {
        console.error('Error cargando reporte por intervalo:', err);
        this.isLoadingReport = false;
      }
    });
  }

  cargar_pedidos(periodo: string, page: number) {
    this.isLoadingPedidos = true;
    this.currentPage = page;

    this.ReportesService.get_pedidos(periodo, page, this.itemsPerPage).subscribe({
      next: (data: PedidosResponseInterface) => {
        this.pedidos = data.orders;
        this.totalPages = data.total_pages;
        this.totalPedidos = data.total;
        this.isLoadingPedidos = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando pedidos:', err);
        this.isLoadingPedidos = false;
        this.pedidos = [];
        this.totalPages = 0;
        this.totalPedidos = 0;
      }
    });
  }

  cargar_pedidos_intervalo(inicio: string, fin: string, page: number) {
    this.isLoadingPedidos = true;
    this.currentPage = page;

    this.ReportesService.get_pedidos_intervalo(inicio, fin, page, this.itemsPerPage).subscribe({
      next: (data: PedidosResponseInterface) => {
        this.pedidos = data.orders;
        this.totalPages = data.total_pages;
        this.totalPedidos = data.total;
        this.isLoadingPedidos = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando pedidos por intervalo:', err);
        this.isLoadingPedidos = false;
        this.pedidos = [];
        this.totalPages = 0;
        this.totalPedidos = 0;
      }
    });
  }

  cargar_graficas(periodo: string) {
    this.isLoadingCharts = true;

    this.ReportesService.get_chart_data(periodo).subscribe({
      next: (data: ChartDataInterface) => {
        this.chartData = data;
        this.isLoadingCharts = false;

        // Esperar a que Angular renderice los canvas
        setTimeout(() => {
          this.crearGraficas();
        }, 100);

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando gráficas:', err);
        this.isLoadingCharts = false;
      }
    });
  }

  cargar_graficas_intervalo(inicio: string, fin: string) {
    this.isLoadingCharts = true;

    this.ReportesService.get_chart_data_intervalo(inicio, fin).subscribe({
      next: (data: ChartDataInterface) => {
        this.chartData = data;
        this.isLoadingCharts = false;

        setTimeout(() => {
          this.crearGraficas();
        }, 100);

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando gráficas por intervalo:', err);
        this.isLoadingCharts = false;
      }
    });
  }

  cargar_platillo_rentable(periodo: string) {
    this.ReportesService.get_platillo_mas_rentable(periodo).subscribe({
      next: (data: PlatilloRentableInterface) => {
        this.platilloRentable = data;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando platillo rentable:', err);
        this.platilloRentable = null;
      }
    });
  }

  cargar_platillo_rentable_intervalo(inicio: string, fin: string) {
    this.ReportesService.get_platillo_mas_rentable_intervalo(inicio, fin).subscribe({
      next: (data: PlatilloRentableInterface) => {
        this.platilloRentable = data;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando platillo rentable por intervalo:', err);
        this.platilloRentable = null;
      }
    });
  }

  crearGraficas() {
    if (!this.chartData) return;

    // Destruir gráficas anteriores si existen
    this.destruirCharts();

    // Gráfica de Ventas (Línea)
    if (this.chartVentasRef && this.chartData.ventas_por_periodo.length > 0) {
      const ctx = this.chartVentasRef.nativeElement.getContext('2d');
      if (ctx) {
        this.chartVentas = new Chart(ctx, {
          type: 'line',
          data: {
            labels: this.chartData.ventas_por_periodo.map(v => v.name),
            datasets: [
              {
                label: 'Ventas ($)',
                data: this.chartData.ventas_por_periodo.map(v => v.ventas),
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y'
              },
              {
                label: 'Pedidos',
                data: this.chartData.ventas_por_periodo.map(v => v.pedidos),
                borderColor: '#8B5E3C',
                backgroundColor: 'rgba(139, 94, 60, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      if (context.datasetIndex === 0) {
                        label += '$' + context.parsed.y.toLocaleString('es-MX', { minimumFractionDigits: 2 });
                      } else {
                        label += context.parsed.y;
                      }
                    }
                    return label;
                  }
                }
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                ticks: {
                  callback: (value) => '$' + Number(value).toLocaleString('es-MX')
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                  drawOnChartArea: false,
                }
              }
            }
          }
        });
      }
    }

    // Gráfica de Distribución (Dona)
    if (this.chartDistribucionRef && this.chartData.distribucion.length > 0) {
      const ctx = this.chartDistribucionRef.nativeElement.getContext('2d');
      if (ctx) {
        this.chartDistribucion = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: this.chartData.distribucion.map(d => d.name),
            datasets: [{
              data: this.chartData.distribucion.map(d => d.value),
              backgroundColor: ['#8B5E3C', '#773832'],
              borderWidth: 2,
              borderColor: '#fff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'bottom'
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }

    // Gráfica de Top Platillos (Barras)
    if (this.chartPlatillosRef && this.chartData.platillos_top.length > 0) {
      const ctx = this.chartPlatillosRef.nativeElement.getContext('2d');
      if (ctx) {
        this.chartPlatillos = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: this.chartData.platillos_top.map(p => p.name),
            datasets: [
              {
                label: 'Cantidad',
                data: this.chartData.platillos_top.map(p => p.cantidad),
                backgroundColor: '#8B5E3C',
                yAxisID: 'y'
              },
              {
                label: 'Ingresos ($)',
                data: this.chartData.platillos_top.map(p => p.ingresos),
                backgroundColor: '#d4af37',
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      if (context.datasetIndex === 1) {
                        label += '$' + context.parsed.y.toLocaleString('es-MX', { minimumFractionDigits: 2 });
                      } else {
                        label += context.parsed.y;
                      }
                    }
                    return label;
                  }
                }
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Cantidad'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: 'Ingresos ($)'
                },
                ticks: {
                  callback: (value) => '$' + Number(value).toLocaleString('es-MX')
                },
                grid: {
                  drawOnChartArea: false,
                }
              }
            }
          }
        });
      }
    }
  }

  cambiarPagina(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.cargar_pedidos(this.tab, page);
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Entregado':
      case 'Pagada':
        return '#4CAF50';
      case 'Cancelado':
        return '#773832';
      case 'En camino':
        return '#2196F3';
      case 'Preparando':
        return '#FFA726';
      default:
        return '#999';
    }
  }

  getTipoColor(tipo: string): string {
    return tipo === 'Local' ? '#2196F3' : '#FF9800';
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  getPaginasVisibles(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;

    if (this.totalPages <= maxPaginas) {
      for (let i = 1; i <= this.totalPages; i++) {
        paginas.push(i);
      }
    } else if (this.currentPage <= 3) {
      for (let i = 1; i <= maxPaginas; i++) {
        paginas.push(i);
      }
    } else if (this.currentPage >= this.totalPages - 2) {
      for (let i = this.totalPages - maxPaginas + 1; i <= this.totalPages; i++) {
        paginas.push(i);
      }
    } else {
      for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
        paginas.push(i);
      }
    }

    return paginas;
  }

  getRangoMostrado(): string {
    if (this.totalPedidos === 0) return 'No hay pedidos';
    const inicio = (this.currentPage - 1) * this.itemsPerPage + 1;
    const fin = Math.min(this.currentPage * this.itemsPerPage, this.totalPedidos);
    return `Mostrando ${inicio} - ${fin} de ${this.totalPedidos} pedidos`;
  }
}