import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TransactionService } from '../../services/transaction.service';
import { GoalService } from '../../services/goal.service';
import { TransactionSummary } from '../../models/transaction.model';
import { GoalProgress } from '../../models/goal.model';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('expenseCanvas', { static: false }) expenseCanvas!: ElementRef<HTMLCanvasElement>;

  // ----- Datos del dashboard -----
  summary: TransactionSummary = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
    byCategory: []
  };

  goalsProgress: GoalProgress[] = [];

  goalsStats = {
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalTargetAmount: 0,
    totalSavedAmount: 0,
    overallProgress: 0
  };

  isLoading = true;

  // ----- Control de suscripciones y limpieza -----
  private destroy$ = new Subject<void>();

  // ----- Chart control -----
  private chart: Chart | null = null;
  private lastChartDataKey = '';
  private updateTimer: any = null; // debounce timer

  constructor(
    private transactionService: TransactionService,
    private goalService: GoalService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  
  ngOnInit() {
    console.log('📱 Dashboard cargado');
    this.loadDashboardData();
    this.subscribeToDataChanges();
  }

  ngAfterViewInit() {
    // Primer intento de crear/actualizar gráfico tras render
    setTimeout(() => this.requestChartUpdate(), 200);
  }

  ngOnDestroy() {
    // limpiar timers y chart
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.chart) {
      try { this.chart.destroy(); } catch (e) { /* ignore */ }
      this.chart = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------------------
  // Carga de datos
  // ---------------------
  async loadDashboardData() {
    try {
      this.isLoading = true;

      
      this.summary = this.transactionService.getCurrentMonthSummary();
      this.goalsProgress = this.goalService.getAllGoalsProgress();
      this.goalsStats = this.goalService.getGoalsStatistics();

      console.log('📊 Datos del dashboard cargados:', {
        balance: this.summary.balance,
        metas: this.goalsProgress.length
      });

    } catch (error) {
      console.error('❌ Error al cargar datos del dashboard:', error);
    } finally {
      this.isLoading = false;
      // En lugar de crear directamente el chart, pedimos una actualización debounced
      this.requestChartUpdate();
    }
  }

  // ---------------------
  // Suscripciones a cambios
  // ---------------------
  private subscribeToDataChanges() {
    // Suscribimos a cambios en las transacciones
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Actualizamos summary y pedimos actualización del chart
        this.summary = this.transactionService.getCurrentMonthSummary();
        this.requestChartUpdate();
      });

    // Suscribimos a cambios en metas
    this.goalService.goals$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.goalsProgress = this.goalService.getAllGoalsProgress();
        this.goalsStats = this.goalService.getGoalsStatistics();
      });
  }

  // ---------------------
  
  // ---------------------
  /**
   * requestChartUpdate()
   * Debouncea y ejecuta la creación/actualización del chart fuera de la zona Angular
   * para evitar bloqueos por detección de cambios masiva.
   */
  private requestChartUpdate() {
    // Debounce simple: esperar 150ms sin nuevas llamadas
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(() => {
      // Ejecutar fuera de Angular para evitar disparar ciclos de CD pesados
      this.ngZone.runOutsideAngular(() => {
        try {
          this.safeCreateOrUpdateChart();
        } catch (err) {
          console.error('Error al actualizar el chart fuera de Angular:', err);
        }
      });
    }, 150);
  }

  /**
   * safeCreateOrUpdateChart()
   * Validaciones y lógica para actualizar datos si existen cambios.
   */
  private safeCreateOrUpdateChart() {
    // Asegurarnos que ViewChild ya esté listo y que exista canvas
    if (!this.expenseCanvas || !this.expenseCanvas.nativeElement) return;

    // Normalizar valores
    const ingresos = Number(this.summary.totalIncome) || 0;
    const gastos = Number(this.summary.totalExpense) || 0;

    // Si no hay datos significativos, destruir chart existente y salir
    if (ingresos === 0 && gastos === 0) {
      if (this.chart) {
        try { this.chart.destroy(); } catch {}
        this.chart = null;
        this.lastChartDataKey = '';
      }
      return;
    }

    const key = `${ingresos}|${gastos}`;
    // Si los datos no han cambiado, no hacemos nada
    if (key === this.lastChartDataKey) return;

    this.lastChartDataKey = key;

    // Si ya existe chart, actualizamos dataset y hacemos update('lazy')
    if (this.chart) {
      const ds = this.chart.data.datasets?.[0];
      if (ds) {
        ds.data = [ingresos, gastos] as any;
        this.chart.data.labels = ['Ingresos', 'Gastos'] as any;
        try {
          // update con modo lazy para disminuir trabajo
          // @ts-ignore Chart.js typing permite pasar 'lazy' en runtime
          this.chart.update('lazy');
          return;
        } catch (err) {
          // si algo falla, destruimos y recreamos
          try { this.chart.destroy(); } catch {}
          this.chart = null;
        }
      } else {
        // dataset inesperado -> destruir para recrear
        try { this.chart.destroy(); } catch {}
        this.chart = null;
      }
    }

    // Si llegamos aquí, no hay chart válido => crear
    this.createChartInstance(ingresos, gastos);
  }

  /**
   * createChartInstance()
   * Crea la instancia del doughnut (donut) para Ingresos vs Gastos.
   */
  private createChartInstance(ingresos: number, gastos: number) {
    if (!this.expenseCanvas || !this.expenseCanvas.nativeElement) return;

    const canvasEl = this.expenseCanvas.nativeElement;
    // fijar tamaño del canvas para evitar relayouts pesados
    // los atributos width/height en el HTML ayudan; aquí nos aseguramos
    canvasEl.width = canvasEl.clientWidth || 300;
    canvasEl.height = canvasEl.clientHeight || 260;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    // Destruir instancia previa si existe
    if (this.chart) {
      try { this.chart.destroy(); } catch {}
      this.chart = null;
    }

    // Crear el chart 
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Ingresos', 'Gastos'],
        datasets: [{
          data: [ingresos, gastos],
          backgroundColor: ['#4ade80', '#f87171'], // verde y rojo
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 4,
          hoverOffset: 12
        }]
      },
      options: {
        cutout: '60%',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.raw ?? 0;
                return new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0
                }).format(value);
              }
            }
          }
        }
      }
    });
  }

  // ---------------------
  //
  // ---------------------
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getBalanceColor(): string {
    if (this.summary.balance > 0) return 'success';
    if (this.summary.balance < 0) return 'danger';
    return 'medium';
  }

  goToTransactions() {
    // Aseguramos que la navegación se ejecute dentro de Angular zone
    this.ngZone.run(() => {
      this.router.navigate(['/tabs/transactions']);
    });
  }

  goToGoals() {
    this.ngZone.run(() => {
      this.router.navigate(['/tabs/goals']);
    });
  }

  async doRefresh(event: any) {
    await this.loadDashboardData();
    event.target.complete();
  }

  getTopCategories() {
    return this.summary.byCategory.slice(0, 5);
  }

  hasData(): boolean {
    return (this.summary.transactionCount > 0) ||
           (this.summary.totalIncome > 0) ||
           (this.summary.totalExpense > 0) ||
           (this.goalsProgress.length > 0);
  }
}
