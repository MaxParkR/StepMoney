import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TransactionService } from '../../services/transaction.service';
import { GoalService } from '../../services/goal.service';
import { TransactionSummary } from '../../models/transaction.model';
import { GoalProgress } from '../../models/goal.model';

/**
 * Página del Dashboard (Pantalla Principal)
 * 
 * Esta es la primera pantalla que ve el usuario al abrir la app.
 * Muestra:
 * - Balance general (ingresos - gastos)
 * - Resumen de gastos por categoría
 * - Progreso de metas de ahorro
 * - Estadísticas del mes actual
 * 
 * @Component: Decorador que define este archivo como un componente de Angular
 * - selector: nombre del componente para usarlo en HTML
 * - templateUrl: archivo HTML con la vista
 * - styleUrls: archivos de estilos CSS/SCSS
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit, OnDestroy {
  
  // Resumen de transacciones del mes actual
  summary: TransactionSummary = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
    byCategory: []
  };

  // Progreso de metas activas
  goalsProgress: GoalProgress[] = [];

  // Estadísticas de metas
  goalsStats = {
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalTargetAmount: 0,
    totalSavedAmount: 0,
    overallProgress: 0
  };

  // Indicador de carga
  isLoading = true;

  // Subject para manejar la destrucción del componente
  private destroy$ = new Subject<void>();

  /**
   * Constructor
   * Inyectamos los servicios que necesitamos:
   * - TransactionService: para obtener transacciones y balances
   * - GoalService: para obtener metas de ahorro
   * - Router: para navegar a otras páginas
   */
  constructor(
    private transactionService: TransactionService,
    private goalService: GoalService,
    private router: Router
  ) {}

  /**
   * ngOnInit - Método del ciclo de vida de Angular
   * Se ejecuta cuando el componente se carga por primera vez
   */
  ngOnInit() {
    console.log('📱 Dashboard cargado');
    this.loadDashboardData();
    this.subscribeToDataChanges();
  }

  /**
   * ngOnDestroy - Método del ciclo de vida de Angular
   * Se ejecuta cuando el componente se destruye
   * Importante para evitar fugas de memoria
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos iniciales del dashboard
   */
  async loadDashboardData() {
    try {
      this.isLoading = true;

      // Obtener resumen del mes actual
      this.summary = this.transactionService.getCurrentMonthSummary();

      // Obtener progreso de metas
      this.goalsProgress = this.goalService.getAllGoalsProgress();

      // Obtener estadísticas de metas
      this.goalsStats = this.goalService.getGoalsStatistics();

      console.log('📊 Datos del dashboard cargados:', {
        balance: this.summary.balance,
        metas: this.goalsProgress.length
      });
    } catch (error) {
      console.error('❌ Error al cargar datos del dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Se suscribe a cambios en transacciones y metas
   * para actualizar automáticamente el dashboard
   */
  private subscribeToDataChanges() {
    // Suscribirse a cambios en transacciones
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.summary = this.transactionService.getCurrentMonthSummary();
      });

    // Suscribirse a cambios en metas
    this.goalService.goals$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.goalsProgress = this.goalService.getAllGoalsProgress();
        this.goalsStats = this.goalService.getGoalsStatistics();
      });
  }

  /**
   * Formatea un número como moneda
   * Ejemplo: 1000 => "$1,000"
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
   * Obtiene el color para mostrar el balance
   * Verde si es positivo, rojo si es negativo
   */
  getBalanceColor(): string {
    if (this.summary.balance > 0) return 'success';
    if (this.summary.balance < 0) return 'danger';
    return 'medium';
  }

  /**
   * Navega a la página de transacciones
   */
  goToTransactions() {
    this.router.navigate(['/tabs/transactions']);
  }

  /**
   * Navega a la página de metas
   */
  goToGoals() {
    this.router.navigate(['/tabs/goals']);
  }

  /**
   * Refresca los datos del dashboard
   * Se ejecuta cuando el usuario hace "pull to refresh"
   */
  async doRefresh(event: any) {
    await this.loadDashboardData();
    event.target.complete();
  }

  /**
   * Obtiene las top 5 categorías con más gastos
   */
  getTopCategories() {
    return this.summary.byCategory.slice(0, 5);
  }

  /**
   * Verifica si hay datos para mostrar
   */
  hasData(): boolean {
    return this.summary.transactionCount > 0 || this.goalsProgress.length > 0;
  }
}
