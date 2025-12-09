// mineria-datos.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import {
  MineriaDatosService,
  PrediccionCancelacionesResponse,
  PatronesTemporalesResponse,
  PrediccionDemandaResponse,
  AnalisisRentabilidadResponse,
  SegmentacionResponse
} from '../../../services/administrador/mineriadatos';

Chart.register(...registerables);

@Component({
  selector: 'app-mineria-datos',
  imports: [CommonModule],
  templateUrl: './mineriadatos.html',
  styleUrl: './mineriadatos.css'
})
export class MineriaDatosComponent implements OnInit, AfterViewInit {
  // Estados de carga
  isLoadingPredicciones = false;
  isLoadingPatrones = false;
  isLoadingDemanda = false;
  isLoadingRentabilidad = false;
  isLoadingSegmentacion = false;

  // Datos
  prediccionCancelaciones: PrediccionCancelacionesResponse | null = null;
  patronesTemporales: PatronesTemporalesResponse | null = null;
  prediccionDemanda: PrediccionDemandaResponse | null = null;
  rentabilidad: AnalisisRentabilidadResponse | null = null;
  segmentacion: SegmentacionResponse | null = null;

  // Referencias a canvas
  @ViewChild('chartRiesgo') chartRiesgoRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartHoras') chartHorasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDemanda') chartDemandaRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartRentabilidad') chartRentabilidadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartSegmentos') chartSegmentosRef!: ElementRef<HTMLCanvasElement>;

  // Instancias de charts
  private chartRiesgo?: Chart;
  private chartHoras?: Chart;
  private chartDemanda?: Chart;
  private chartRentabilidad?: Chart;
  private chartSegmentos?: Chart;

  // Tab activo
  tabActivo: string = 'predicciones';

  constructor(private mineriaDatosService: MineriaDatosService) { }

  ngOnInit(): void {
    this.cargarPredicciones();
  }

  ngAfterViewInit(): void {
    // Las gráficas se crearán cuando los datos estén disponibles
  }

  cambiarTab(tab: string): void {
    this.tabActivo = tab;

    // Cargar datos según el tab seleccionado
    switch (tab) {
      case 'predicciones':
        if (!this.prediccionCancelaciones) {
          this.cargarPredicciones();
        }
        break;
      case 'patrones':
        if (!this.patronesTemporales) {
          this.cargarPatrones();
        }
        break;
      case 'demanda':
        if (!this.prediccionDemanda) {
          this.cargarDemanda();
        }
        break;
      case 'rentabilidad':
        if (!this.rentabilidad) {
          this.cargarRentabilidad();
        }
        break;
      case 'segmentacion':
        if (!this.segmentacion) {
          this.cargarSegmentacion();
        }
        break;
    }
  }

  cargarPredicciones(): void {
    this.isLoadingPredicciones = true;

    this.mineriaDatosService.getPredicionCancelaciones().subscribe({
      next: (data) => {
        this.prediccionCancelaciones = data;
        this.isLoadingPredicciones = false;

        setTimeout(() => {
          this.crearGraficaRiesgo();
        }, 100);
      },
      error: (err) => {
        console.error('Error cargando predicciones:', err);
        this.isLoadingPredicciones = false;
      }
    });
  }

  cargarPatrones(): void {
    this.isLoadingPatrones = true;

    this.mineriaDatosService.getPatronesTemporales().subscribe({
      next: (data) => {
        this.patronesTemporales = data;
        this.isLoadingPatrones = false;

        setTimeout(() => {
          this.crearGraficaHoras();
        }, 100);
      },
      error: (err) => {
        console.error('Error cargando patrones:', err);
        this.isLoadingPatrones = false;
      }
    });
  }

  cargarDemanda(): void {
    this.isLoadingDemanda = true;

    this.mineriaDatosService.getPrediccionDemanda().subscribe({
      next: (data) => {
        this.prediccionDemanda = data;
        this.isLoadingDemanda = false;

        setTimeout(() => {
          this.crearGraficaDemanda();
        }, 100);
      },
      error: (err) => {
        console.error('Error cargando demanda:', err);
        this.isLoadingDemanda = false;
      }
    });
  }

  cargarRentabilidad(): void {
    this.isLoadingRentabilidad = true;

    this.mineriaDatosService.getAnalisisRentabilidad().subscribe({
      next: (data) => {
        this.rentabilidad = data;
        this.isLoadingRentabilidad = false;

        setTimeout(() => {
          this.crearGraficaRentabilidad();
        }, 100);
      },
      error: (err) => {
        console.error('Error cargando rentabilidad:', err);
        this.isLoadingRentabilidad = false;
      }
    });
  }

  cargarSegmentacion(): void {
    this.isLoadingSegmentacion = true;

    this.mineriaDatosService.getSegmentacionClientes().subscribe({
      next: (data) => {
        this.segmentacion = data;
        this.isLoadingSegmentacion = false;

        setTimeout(() => {
          this.crearGraficaSegmentos();
        }, 100);
      },
      error: (err) => {
        console.error('Error cargando segmentación:', err);
        this.isLoadingSegmentacion = false;
      }
    });
  }

  crearGraficaRiesgo(): void {
    if (!this.chartRiesgoRef || !this.prediccionCancelaciones) return;

    if (this.chartRiesgo) {
      this.chartRiesgo.destroy();
    }

    const ctx = this.chartRiesgoRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const datos = this.prediccionCancelaciones.predicciones;

    this.chartRiesgo = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.platillo),
        datasets: [{
          label: 'Tasa de Cancelación (%)',
          data: datos.map(d => d.tasa_cancelacion),
          backgroundColor: datos.map(d => {
            if (d.nivel_riesgo === 'Alto') return 'rgba(255, 99, 132, 0.7)';
            if (d.nivel_riesgo === 'Medio') return 'rgba(255, 206, 86, 0.7)';
            return 'rgba(75, 192, 192, 0.7)';
          }),
          borderColor: datos.map(d => {
            if (d.nivel_riesgo === 'Alto') return 'rgb(255, 99, 132)';
            if (d.nivel_riesgo === 'Medio') return 'rgb(255, 206, 86)';
            return 'rgb(75, 192, 192)';
          }),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (value !== null && value !== undefined) {
                  return `Cancelaciones: ${value.toFixed(2)}%`;
                }
                return 'Cancelaciones: 0%';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Tasa de Cancelación (%)'
            }
          }
        }
      }
    });
  }

  crearGraficaHoras(): void {
    if (!this.chartHorasRef || !this.patronesTemporales) return;

    if (this.chartHoras) {
      this.chartHoras.destroy();
    }

    const ctx = this.chartHorasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const datos = this.patronesTemporales.ventas_por_hora;

    this.chartHoras = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datos.map(d => d.hora),
        datasets: [
          {
            label: 'Pedidos',
            data: datos.map(d => d.pedidos),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Ingresos ($)',
            data: datos.map(d => d.ingresos),
            borderColor: 'rgb(212, 175, 55)',
            backgroundColor: 'rgba(212, 175, 55, 0.2)',
            tension: 0.4,
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
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (value !== null && value !== undefined) {
                  if (context.datasetIndex === 0) {
                    return `${label}: ${value}`;
                  } else {
                    return `${label}: ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                  }
                }
                return `${label}: 0`;
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
              text: 'Número de Pedidos'
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
            grid: {
              drawOnChartArea: false,
            }
          }
        }
      }
    });
  }

  crearGraficaDemanda(): void {
    if (!this.chartDemandaRef || !this.prediccionDemanda) return;

    if (this.chartDemanda) {
      this.chartDemanda.destroy();
    }

    const ctx = this.chartDemandaRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const datos = this.prediccionDemanda.predicciones.slice(0, 10);

    this.chartDemanda = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.platillo),
        datasets: [
          {
            label: 'Demanda Actual',
            data: datos.map(d => d.demanda_ultima_semana),
            backgroundColor: 'rgba(54, 162, 235, 0.7)'
          },
          {
            label: 'Predicción Próxima Semana',
            data: datos.map(d => d.prediccion_proxima_semana),
            backgroundColor: 'rgba(255, 206, 86, 0.7)'
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
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (value !== null && value !== undefined) {
                  return `${label}: ${value.toFixed(1)} unidades`;
                }
                return `${label}: 0 unidades`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Unidades'
            }
          }
        }
      }
    });
  }

  crearGraficaRentabilidad(): void {
    if (!this.chartRentabilidadRef || !this.rentabilidad) return;

    if (this.chartRentabilidad) {
      this.chartRentabilidad.destroy();
    }

    const ctx = this.chartRentabilidadRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const datos = this.rentabilidad.top_rentables;

    this.chartRentabilidad = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.platillo),
        datasets: [{
          label: 'Ganancia Total ($)',
          data: datos.map(d => d.ganancia_total),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 2
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.x;
                if (value !== null && value !== undefined) {
                  return `Ganancia: ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                }
                return 'Ganancia: $0.00';
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Ganancia ($)'
            }
          }
        }
      }
    });
  }

  crearGraficaSegmentos(): void {
    if (!this.chartSegmentosRef || !this.segmentacion) return;

    if (this.chartSegmentos) {
      this.chartSegmentos.destroy();
    }

    const ctx = this.chartSegmentosRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const datos = this.segmentacion.resumen_por_tipo;

    this.chartSegmentos = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: datos.map(d => d.tipo),
        datasets: [{
          data: datos.map(d => d.ingresos_totales),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                if (value !== null && value !== undefined) {
                  return `${label}: ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                }
                return `${label}: $0.00`;
              }
            }
          }
        }
      }
    });
  }

  getNivelRiesgoColor(nivel: string): string {
    switch (nivel) {
      case 'Alto': return '#ff4444';
      case 'Medio': return '#ffaa00';
      case 'Bajo': return '#00C851';
      default: return '#666';
    }
  }

  getTendenciaColor(tendencia: string): string {
    switch (tendencia) {
      case 'Creciente': return '#00C851';
      case 'Estable': return '#ffaa00';
      case 'Decreciente': return '#ff4444';
      default: return '#666';
    }
  }

  getTendenciaIcono(tendencia: string): string {
    switch (tendencia) {
      case 'Creciente': return '📈';
      case 'Estable': return '➡️';
      case 'Decreciente': return '📉';
      default: return '';
    }
  }

  ngOnDestroy(): void {
    if (this.chartRiesgo) this.chartRiesgo.destroy();
    if (this.chartHoras) this.chartHoras.destroy();
    if (this.chartDemanda) this.chartDemanda.destroy();
    if (this.chartRentabilidad) this.chartRentabilidad.destroy();
    if (this.chartSegmentos) this.chartSegmentos.destroy();
  }
}