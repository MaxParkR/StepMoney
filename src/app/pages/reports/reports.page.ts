import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ReportService } from '../../services/report.service';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

/**
 * Página de Reportes
 * 
 * Muestra reportes financieros con gráficos:
 * - Gastos por categoría (pastel)
 * - Ingresos vs Gastos (barras)
 * - Tendencia de balance (línea)
 * - Progreso de metas
 * - Resumen ejecutivo
 */
@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: false
})
export class ReportsPage implements OnInit, AfterViewInit {

  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef;
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef;
  @ViewChild('goalsChartCanvas') goalsChartCanvas!: ElementRef;

  // Instancias de gráficos
  pieChart: Chart | null = null;
  barChart: Chart | null = null;
  lineChart: Chart | null = null;
  goalsChart: Chart | null = null;

  // Resumen ejecutivo
  summary: any = null;

  // Vista seleccionada
  selectedView: 'charts' | 'summary' = 'charts';

  // Loading
  isLoading = true;

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    console.log('📊 Página de reportes cargada');
    this.loadSummary();
  }

  ngAfterViewInit() {
    // Crear gráficos después de que la vista esté lista
    setTimeout(() => {
      this.createCharts();
      this.isLoading = false;
    }, 500);
  }

  /**
   * Carga el resumen ejecutivo
   */
  loadSummary() {
    try {
      this.summary = this.reportService.getExecutiveSummary();
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  }

  /**
   * Crea todos los gráficos
   */
  createCharts() {
    this.createPieChart();
    this.createBarChart();
    this.createLineChart();
    this.createGoalsChart();
  }

  /**
   * Crea el gráfico de pastel (gastos por categoría)
   */
  createPieChart() {
    if (!this.pieChartCanvas) return;

    try {
      const data = this.reportService.getCategoryPieChartData();
      
      if (data.labels.length === 0) {
        return; // No hay datos
      }

      const config: ChartConfiguration = {
        type: 'pie',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: {
                  size: 12
                }
              }
            },
            title: {
              display: true,
              text: 'Distribución de Gastos por Categoría',
              font: {
                size: 16,
                weight: 'bold'
              }
            }
          }
        }
      };

      this.pieChart = new Chart(this.pieChartCanvas.nativeElement, config);
    } catch (error) {
      console.error('Error al crear gráfico de pastel:', error);
    }
  }

  /**
   * Crea el gráfico de barras (ingresos vs gastos)
   */
  createBarChart() {
    if (!this.barChartCanvas) return;

    try {
      const data = this.reportService.getIncomeVsExpenseBarChartData(6);

      const config: ChartConfiguration = {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                padding: 15,
                font: {
                  size: 12
                }
              }
            },
            title: {
              display: true,
              text: 'Ingresos vs Gastos (Últimos 6 meses)',
              font: {
                size: 16,
                weight: 'bold'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      };

      this.barChart = new Chart(this.barChartCanvas.nativeElement, config);
    } catch (error) {
      console.error('Error al crear gráfico de barras:', error);
    }
  }

  /**
   * Crea el gráfico de líneas (tendencia de balance)
   */
  createLineChart() {
    if (!this.lineChartCanvas) return;

    try {
      const data = this.reportService.getBalanceTrendLineChartData(6);

      const config: ChartConfiguration = {
        type: 'line',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Tendencia de Balance',
              font: {
                size: 16,
                weight: 'bold'
              }
            }
          },
          scales: {
            y: {
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      };

      this.lineChart = new Chart(this.lineChartCanvas.nativeElement, config);
    } catch (error) {
      console.error('Error al crear gráfico de líneas:', error);
    }
  }

  /**
   * Crea el gráfico de progreso de metas
   */
  createGoalsChart() {
    if (!this.goalsChartCanvas) return;

    try {
      const data = this.reportService.getGoalsProgressData();

      if (data.labels.length === 0) {
        return; // No hay metas
      }

      const config: ChartConfiguration = {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Progreso de Metas',
              font: {
                size: 16,
                weight: 'bold'
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      };

      this.goalsChart = new Chart(this.goalsChartCanvas.nativeElement, config);
    } catch (error) {
      console.error('Error al crear gráfico de metas:', error);
    }
  }

  /**
   * Cambia la vista entre gráficos y resumen
   */
  onViewChange(event: any) {
    this.selectedView = event.detail.value;
  }

  /**
   * Descarga el reporte como texto
   */
  downloadReport() {
    this.reportService.downloadTextReport();
  }

  /**
   * Formatea un número como moneda
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Destruye los gráficos al salir
   */
  ngOnDestroy() {
    if (this.pieChart) this.pieChart.destroy();
    if (this.barChart) this.barChart.destroy();
    if (this.lineChart) this.lineChart.destroy();
    if (this.goalsChart) this.goalsChart.destroy();
  }
}
