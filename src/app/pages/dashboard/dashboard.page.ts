import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TransactionService } from '../../services/transaction.service';
import { GoalService } from '../../services/goal.service';
import { UserProfileService } from '../../services/user-profile.service';
import { TransactionSummary, ExtendedBalance } from '../../models/transaction.model';
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

  // Balance extendido con información de metas
  extendedBalance: ExtendedBalance = {
    totalIncome: 0,
    totalExpense: 0,
    balanceTotal: 0,
    balanceSavedInGoals: 0,
    balanceAvailable: 0,
    transactionCount: 0,
    activeGoalsCount: 0,
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

  // ----- Información del usuario -----
  userName = '';

  // ----- Selector de período -----
  selectedMonth: number;
  selectedYear: number;
  
  // Nombres de los meses
  private monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // ----- Control de suscripciones y limpieza -----
  private destroy$ = new Subject<void>();

  // ----- Chart control -----
  private chart: Chart | null = null;
  private lastChartDataKey = '';
  private updateTimer: any = null; // debounce timer

  constructor(
    private transactionService: TransactionService,
    private goalService: GoalService,
    private userProfileService: UserProfileService,
    private router: Router,
    private ngZone: NgZone,
    private alertController: AlertController
  ) {
    // Inicializar con el mes actual
    const now = new Date();
    this.selectedMonth = now.getMonth();
    this.selectedYear = now.getFullYear();
  }

  
  ngOnInit() {
    console.log('📱 Dashboard cargado');
    this.loadUserName();
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
  // Cargar información del usuario
  // ---------------------
  async loadUserName() {
    try {
      const userProfile = await this.userProfileService.getCurrentUserProfile();
      if (userProfile && userProfile.fullName) {
        // Obtener solo el primer nombre
        const firstName = userProfile.fullName.split(' ')[0];
        this.userName = firstName;
        console.log('👤 Usuario:', this.userName);
      } else {
        this.userName = '';
        console.log('👤 No hay perfil de usuario configurado');
      }
    } catch (error) {
      console.error('❌ Error al cargar nombre de usuario:', error);
      this.userName = '';
    }
  }

  // ---------------------
  // Carga de datos
  // ---------------------
  async loadDashboardData() {
    try {
      this.isLoading = true;

      // Obtener resumen del mes seleccionado
      this.summary = this.getSelectedMonthSummary();
      this.goalsProgress = this.goalService.getAllGoalsProgress();
      this.goalsStats = this.goalService.getGoalsStatistics();
      
      // Calcular balance extendido
      this.extendedBalance = this.calculateExtendedBalance();

      console.log('📊 Datos del dashboard cargados:', {
        mes: this.getSelectedMonthName(),
        año: this.selectedYear,
        balanceTotal: this.extendedBalance.balanceTotal,
        balanceDisponible: this.extendedBalance.balanceAvailable,
        balanceAhorrado: this.extendedBalance.balanceSavedInGoals,
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
  // Obtener resumen del mes seleccionado
  // ---------------------
  private getSelectedMonthSummary(): TransactionSummary {
    const startOfMonth = new Date(this.selectedYear, this.selectedMonth, 1);
    const endOfMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0);

    return this.transactionService.getTransactionsSummary({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    });
  }

  // ---------------------
  // Calcular balance extendido
  // ---------------------
  /**
   * Calcula el balance extendido combinando transacciones y metas
   * Proporciona una vista realista de la situación financiera
   * 
   * Balance Total = Todo tu dinero (Ingresos - Gastos)
   * Balance Ahorrado = Dinero comprometido en metas activas
   * Balance Disponible = Dinero que puedes gastar libremente (Total - Ahorrado)
   */
  calculateExtendedBalance(): ExtendedBalance {
    // Usar el resumen ya calculado
    const summary = this.summary;
    
    // Calcular dinero comprometido en metas activas (todas las metas, no solo del mes)
    const activeGoals = this.goalService.getActiveGoals();
    const balanceSavedInGoals = activeGoals.reduce((total, goal) => {
      return total + goal.currentAmount;
    }, 0);
    
    // Calcular balance disponible
    // Si tu balance total es menor que lo ahorrado, el disponible es 0
    const balanceAvailable = Math.max(0, summary.balance - balanceSavedInGoals);
    
    return {
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      balanceTotal: summary.balance,
      balanceSavedInGoals: balanceSavedInGoals,
      balanceAvailable: balanceAvailable,
      transactionCount: summary.transactionCount,
      activeGoalsCount: activeGoals.length,
      byCategory: summary.byCategory
    };
  }

  // ---------------------
  // Navegación de meses
  // ---------------------
  previousMonth() {
    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.loadDashboardData();
  }

  nextMonth() {
    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.loadDashboardData();
  }

  goToCurrentMonth() {
    const now = new Date();
    this.selectedMonth = now.getMonth();
    this.selectedYear = now.getFullYear();
    this.loadDashboardData();
  }

  getSelectedMonthName(): string {
    return this.monthNames[this.selectedMonth];
  }

  isCurrentMonth(): boolean {
    const now = new Date();
    return this.selectedMonth === now.getMonth() && this.selectedYear === now.getFullYear();
  }

  // ---------------------
  // Suscripciones a cambios
  // ---------------------
  private subscribeToDataChanges() {
    // Suscribimos a cambios en las transacciones
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Actualizamos summary del mes seleccionado
        this.summary = this.getSelectedMonthSummary();
        // Recalcular balance extendido cuando cambian las transacciones
        this.extendedBalance = this.calculateExtendedBalance();
        // Actualizar gráfico
        this.requestChartUpdate();
      });

    // Suscribimos a cambios en metas
    this.goalService.goals$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.goalsProgress = this.goalService.getAllGoalsProgress();
        this.goalsStats = this.goalService.getGoalsStatistics();
        // Recalcular balance extendido cuando cambian las metas
        this.extendedBalance = this.calculateExtendedBalance();
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

  goToReports() {
    this.ngZone.run(() => {
      this.router.navigate(['/tabs/reports']);
    });
  }

  /**
   * Calcula el porcentaje de un valor sobre un total
   */
  getPercentage(value: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * Muestra información explicativa sobre el balance
   */
  async showBalanceInfo() {
    const alert = await this.alertController.create({
      header: '💡 Entendiendo tu Balance',
      cssClass: 'balance-info-alert',
      message: 
        '🏦 BALANCE TOTAL\n' +
        'Todo tu dinero (Ingresos - Gastos)\n\n' +
        
        '💰 DISPONIBLE PARA GASTAR\n' +
        'Dinero libre que puedes usar sin afectar tus metas de ahorro\n\n' +
        
        '🎯 AHORRADO EN METAS\n' +
        'Dinero comprometido en tus objetivos. Este dinero sigue siendo tuyo, pero está reservado para cumplir tus metas.\n\n' +
        
        '📊 FÓRMULA\n' +
        'Disponible = Balance Total - Ahorrado\n\n' +
        
        '💡 EJEMPLO\n' +
        'Si tienes $1,000,000 de balance total y has ahorrado $300,000 en metas, tu dinero disponible es $700,000.',
      buttons: [
        {
          text: 'Entendido',
          cssClass: 'alert-button-confirm'
        }
      ]
    });
    await alert.present();
  }

  addTransaction() {
    this.ngZone.run(() => {
      this.router.navigate(['/tabs/transactions'], { 
        queryParams: { action: 'add' } 
      });
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

  getCurrentMonthName(): string {
    return this.monthNames[this.selectedMonth];
  }

  getSelectedPeriodLabel(): string {
    return `${this.monthNames[this.selectedMonth]} ${this.selectedYear}`;
  }

  getCurrentDay(): number {
    const currentDate = new Date();
    return currentDate.getDate();
  }
}
