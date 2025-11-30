import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { TransactionService } from '../../services/transaction.service';
import { GoalService } from '../../services/goal.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

/**
 * Página de Reportes Financieros - Rediseño Completo
 */
@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: false
})
export class ReportsPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef;
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef;

  // Instancias de gráficos
  private pieChart: Chart | null = null;
  private barChart: Chart | null = null;
  private lineChart: Chart | null = null;

  // Selector de período
  selectedMonth: number;
  selectedYear: number;
  private monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Datos del reporte
  summary = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
    byCategory: [] as any[]
  };

  // Estadísticas de metas
  goalsStats = {
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalSavedAmount: 0,
    totalTargetAmount: 0,
    overallProgress: 0
  };

  // Promedios
  averages = {
    income: 0,
    expense: 0,
    balance: 0
  };

  // Top categorías
  topCategories: any[] = [];

  // Vista seleccionada
  selectedView: 'charts' | 'summary' = 'charts';

  // Loading y control
  isLoading = true;
  hasData = false;
  private destroy$ = new Subject<void>();
  private chartsInitialized = false;

  constructor(
    private transactionService: TransactionService,
    private goalService: GoalService,
    private ngZone: NgZone
  ) {
    const now = new Date();
    this.selectedMonth = now.getMonth();
    this.selectedYear = now.getFullYear();
  }

  /**
   * Parsea una fecha en formato YYYY-MM-DD a objeto Date en zona horaria local
   * Evita problemas de conversión UTC
   */
  private parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day); // mes es 0-indexed
  }

  ngOnInit() {
    console.log('📊 Página de reportes cargada');
    this.loadData();
    this.subscribeToChanges();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.chartsInitialized = true;
      this.createAllCharts();
      this.isLoading = false;
    }, 300);
  }

  ngOnDestroy() {
    this.destroyCharts();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChanges() {
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadData();
        if (this.chartsInitialized) {
          this.createAllCharts();
        }
      });

    this.goalService.goals$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.goalsStats = this.goalService.getGoalsStatistics();
      });
  }

  loadData() {
    // Obtener resumen del mes seleccionado
    const startOfMonth = new Date(this.selectedYear, this.selectedMonth, 1);
    const endOfMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0);

    this.summary = this.transactionService.getTransactionsSummary({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    });

    // Estadísticas de metas
    this.goalsStats = this.goalService.getGoalsStatistics();

    // Calcular promedios de los últimos 6 meses
    this.calculateAverages();

    // Top categorías
    this.topCategories = this.summary.byCategory.slice(0, 5);

    // Verificar si hay datos
    this.hasData = this.summary.transactionCount > 0 || 
                   this.transactionService.getAllTransactions().length > 0;

    console.log('📊 Datos cargados:', {
      mes: this.getSelectedPeriodLabel(),
      ingresos: this.summary.totalIncome,
      gastos: this.summary.totalExpense,
      transacciones: this.summary.transactionCount
    });
  }

  private calculateAverages() {
    const allTransactions = this.transactionService.getAllTransactions();
    const now = new Date();
    let totalIncome = 0;
    let totalExpense = 0;
    let monthsWithData = 0;

    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthTransactions = allTransactions.filter(txn => {
        const txnDate = this.parseLocalDate(txn.date);
        return txnDate.getMonth() === month && txnDate.getFullYear() === year;
      });

      if (monthTransactions.length > 0) {
        monthsWithData++;
        totalIncome += monthTransactions
          .filter(txn => txn.type === 'income')
          .reduce((sum, txn) => sum + txn.amount, 0);
        totalExpense += monthTransactions
          .filter(txn => txn.type === 'expense')
          .reduce((sum, txn) => sum + txn.amount, 0);
      }
    }

    const divisor = monthsWithData || 1;
    this.averages = {
      income: Math.round(totalIncome / divisor),
      expense: Math.round(totalExpense / divisor),
      balance: Math.round((totalIncome - totalExpense) / divisor)
    };
  }

  // Navegación de meses
  previousMonth() {
    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.loadData();
    this.createAllCharts();
  }

  nextMonth() {
    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.loadData();
    this.createAllCharts();
  }

  goToCurrentMonth() {
    const now = new Date();
    this.selectedMonth = now.getMonth();
    this.selectedYear = now.getFullYear();
    this.loadData();
    this.createAllCharts();
  }

  getSelectedPeriodLabel(): string {
    return `${this.monthNames[this.selectedMonth]} ${this.selectedYear}`;
  }

  isCurrentMonth(): boolean {
    const now = new Date();
    return this.selectedMonth === now.getMonth() && this.selectedYear === now.getFullYear();
  }

  // Cambio de vista
  onViewChange(event: any) {
    this.selectedView = event.detail.value;
    if (this.selectedView === 'charts' && this.chartsInitialized) {
      setTimeout(() => this.createAllCharts(), 100);
    }
  }

  // Creación de gráficos
  private createAllCharts() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.destroyCharts();
        this.createPieChart();
        this.createBarChart();
        this.createLineChart();
      }, 50);
    });
  }

  private destroyCharts() {
    if (this.pieChart) {
      try { this.pieChart.destroy(); } catch {}
      this.pieChart = null;
    }
    if (this.barChart) {
      try { this.barChart.destroy(); } catch {}
      this.barChart = null;
    }
    if (this.lineChart) {
      try { this.lineChart.destroy(); } catch {}
      this.lineChart = null;
    }
  }

  private createPieChart() {
    if (!this.pieChartCanvas?.nativeElement) return;
    if (this.summary.byCategory.length === 0) return;

    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.summary.byCategory.map(cat => cat.categoryName);
    const data = this.summary.byCategory.map(cat => cat.total);
    const colors = this.summary.byCategory.map(cat => cat.categoryColor);

    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              font: { size: 12, weight: 'bold' }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return ` ${this.formatCurrency(value)}`;
              }
            }
          }
        }
      }
    });
  }

  private createBarChart() {
    if (!this.barChartCanvas?.nativeElement) return;

    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const monthlyData = this.getLastMonthsData(6);

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyData.map(m => m.label),
        datasets: [
          {
            label: 'Ingresos',
            data: monthlyData.map(m => m.income),
            backgroundColor: 'rgba(45, 211, 111, 0.8)',
            borderColor: '#28ba62',
            borderWidth: 2,
            borderRadius: 8
          },
          {
            label: 'Gastos',
            data: monthlyData.map(m => m.expense),
            backgroundColor: 'rgba(235, 68, 90, 0.8)',
            borderColor: '#cf3c4f',
            borderWidth: 2,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 16,
              usePointStyle: true,
              font: { size: 12, weight: 'bold' }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return ` ${context.dataset.label}: ${this.formatCurrency(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              callback: (value) => '$' + Number(value).toLocaleString()
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  private createLineChart() {
    if (!this.lineChartCanvas?.nativeElement) return;

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const monthlyData = this.getLastMonthsData(6);

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthlyData.map(m => m.label),
        datasets: [{
          label: 'Balance',
          data: monthlyData.map(m => m.balance),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return ` Balance: ${this.formatCurrency(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              callback: (value) => '$' + Number(value).toLocaleString()
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  private getLastMonthsData(months: number) {
    const allTransactions = this.transactionService.getAllTransactions();
    const monthlyData = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthTransactions = allTransactions.filter(txn => {
        const txnDate = this.parseLocalDate(txn.date);
        return txnDate.getMonth() === month && txnDate.getFullYear() === year;
      });

      const income = monthTransactions
        .filter(txn => txn.type === 'income')
        .reduce((sum, txn) => sum + txn.amount, 0);

      const expense = monthTransactions
        .filter(txn => txn.type === 'expense')
        .reduce((sum, txn) => sum + txn.amount, 0);

      monthlyData.push({
        label: this.monthNames[month].substring(0, 3),
        month,
        year,
        income,
        expense,
        balance: income - expense
      });
    }

    return monthlyData;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getBalanceClass(): string {
    return this.summary.balance >= 0 ? 'positive' : 'negative';
  }

  downloadReport() {
    // Implementación simple de descarga
    const report = this.generateTextReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_stepmoney_${this.selectedYear}_${this.selectedMonth + 1}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private generateTextReport(): string {
    return `
═══════════════════════════════════════════
      REPORTE FINANCIERO - STEPMONEY
═══════════════════════════════════════════

Período: ${this.getSelectedPeriodLabel()}
Generado: ${new Date().toLocaleString('es-CO')}

───────────────────────────────────────────
RESUMEN DEL MES
───────────────────────────────────────────

Ingresos:        ${this.formatCurrency(this.summary.totalIncome)}
Gastos:          ${this.formatCurrency(this.summary.totalExpense)}
Balance:         ${this.formatCurrency(this.summary.balance)}
Transacciones:   ${this.summary.transactionCount}

───────────────────────────────────────────
METAS DE AHORRO
───────────────────────────────────────────

Total de metas:    ${this.goalsStats.totalGoals}
Activas:           ${this.goalsStats.activeGoals}
Completadas:       ${this.goalsStats.completedGoals}
Progreso general:  ${this.goalsStats.overallProgress.toFixed(1)}%
Ahorrado:          ${this.formatCurrency(this.goalsStats.totalSavedAmount)}

═══════════════════════════════════════════
    `.trim();
  }

  doRefresh(event: any) {
    this.loadData();
    this.createAllCharts();
    setTimeout(() => event.target.complete(), 500);
  }
}
