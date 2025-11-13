import { Injectable } from '@angular/core';
import { TransactionService } from './transaction.service';
import { GoalService } from './goal.service';
import { Transaction } from '../models/transaction.model';

/**
 * Servicio de Reportes y Estadísticas
 * 
 * Genera reportes financieros con datos para gráficos:
 * - Reporte mensual (ingresos vs gastos)
 * - Distribución de gastos por categoría
 * - Tendencias de ahorro
 * - Progreso de metas
 * - Comparativas entre períodos
 */
@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(
    private transactionService: TransactionService,
    private goalService: GoalService
  ) {
    console.log('📊 ReportService inicializado');
  }

  /**
   * Genera reporte del mes actual
   */
  getCurrentMonthReport() {
    const summary = this.transactionService.getCurrentMonthSummary();
    const transactions = this.transactionService.getCurrentMonthTransactions();
    
    return {
      summary,
      transactions,
      period: this.getCurrentMonthPeriod()
    };
  }

  /**
   * Obtiene el período del mes actual
   */
  private getCurrentMonthPeriod() {
    const now = new Date();
    const monthName = now.toLocaleDateString('es-CO', { month: 'long' });
    const year = now.getFullYear();
    
    return {
      label: `${monthName} ${year}`,
      month: now.getMonth(),
      year: year
    };
  }

  /**
   * Genera datos para gráfico de pastel (gastos por categoría)
   */
  getCategoryPieChartData() {
    const summary = this.transactionService.getCurrentMonthSummary();
    
    const labels = summary.byCategory.map(cat => cat.categoryName);
    const data = summary.byCategory.map(cat => cat.total);
    const colors = summary.byCategory.map(cat => cat.categoryColor);
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  /**
   * Genera datos para gráfico de barras (ingresos vs gastos por mes)
   */
  getIncomeVsExpenseBarChartData(months: number = 6) {
    const monthlyData = this.getLastMonthsData(months);
    
    return {
      labels: monthlyData.map(m => m.label),
      datasets: [
        {
          label: 'Ingresos',
          data: monthlyData.map(m => m.income),
          backgroundColor: '#2DD36F',
          borderColor: '#28ba62',
          borderWidth: 2
        },
        {
          label: 'Gastos',
          data: monthlyData.map(m => m.expense),
          backgroundColor: '#EB445A',
          borderColor: '#cf3c4f',
          borderWidth: 2
        }
      ]
    };
  }

  /**
   * Obtiene datos de los últimos N meses
   */
  private getLastMonthsData(months: number) {
    const allTransactions = this.transactionService.getAllTransactions();
    const monthlyData = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthTransactions = allTransactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate.getMonth() === month && txnDate.getFullYear() === year;
      });
      
      const income = monthTransactions
        .filter(txn => txn.type === 'income')
        .reduce((sum, txn) => sum + txn.amount, 0);
      
      const expense = monthTransactions
        .filter(txn => txn.type === 'expense')
        .reduce((sum, txn) => sum + txn.amount, 0);
      
      monthlyData.push({
        label: date.toLocaleDateString('es-CO', { month: 'short' }),
        month,
        year,
        income,
        expense,
        balance: income - expense
      });
    }
    
    return monthlyData;
  }

  /**
   * Genera datos para gráfico de líneas (tendencia de balance)
   */
  getBalanceTrendLineChartData(months: number = 6) {
    const monthlyData = this.getLastMonthsData(months);
    
    return {
      labels: monthlyData.map(m => m.label),
      datasets: [{
        label: 'Balance',
        data: monthlyData.map(m => m.balance),
        borderColor: '#3CA8E8',
        backgroundColor: 'rgba(60, 168, 232, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    };
  }

  /**
   * Genera datos para gráfico de progreso de metas
   */
  getGoalsProgressData() {
    const goalsProgress = this.goalService.getAllGoalsProgress();
    
    const labels = goalsProgress.map(g => g.goalName);
    const data = goalsProgress.map(g => g.percentage);
    
    const colors = goalsProgress.map(g => {
      if (g.percentage >= 100) return '#2DD36F';
      if (g.percentage >= 50) return '#3CA8E8';
      if (g.percentage >= 25) return '#FFC409';
      return '#EB445A';
    });
    
    return {
      labels,
      datasets: [{
        label: 'Progreso (%)',
        data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2
      }]
    };
  }

  /**
   * Genera reporte de gastos diarios del mes
   */
  getDailyExpensesData() {
    const transactions = this.transactionService.getCurrentMonthTransactions();
    const expenses = transactions.filter(txn => txn.type === 'expense');
    
    // Agrupar por día
    const dailyMap = new Map<string, number>();
    
    expenses.forEach(txn => {
      const day = new Date(txn.date).getDate();
      const key = day.toString();
      const current = dailyMap.get(key) || 0;
      dailyMap.set(key, current + txn.amount);
    });
    
    // Convertir a array ordenado
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const amounts = days.map(day => dailyMap.get(day) || 0);
    
    return {
      labels: days,
      datasets: [{
        label: 'Gastos Diarios',
        data: amounts,
        backgroundColor: 'rgba(235, 68, 90, 0.5)',
        borderColor: '#EB445A',
        borderWidth: 2,
        fill: true
      }]
    };
  }

  /**
   * Genera resumen ejecutivo
   */
  getExecutiveSummary() {
    const currentMonth = this.transactionService.getCurrentMonthSummary();
    const goalsStats = this.goalService.getGoalsStatistics();
    const allTransactions = this.transactionService.getAllTransactions();
    
    // Calcular promedios
    const monthlyData = this.getLastMonthsData(6);
    const avgIncome = monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length;
    const avgExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0) / monthlyData.length;
    
    // Categoría con más gastos
    const topCategory = currentMonth.byCategory.length > 0 
      ? currentMonth.byCategory[0]
      : null;
    
    return {
      currentMonth: {
        income: currentMonth.totalIncome,
        expense: currentMonth.totalExpense,
        balance: currentMonth.balance,
        transactions: currentMonth.transactionCount
      },
      averages: {
        income: Math.round(avgIncome),
        expense: Math.round(avgExpense),
        balance: Math.round(avgIncome - avgExpense)
      },
      goals: {
        total: goalsStats.totalGoals,
        active: goalsStats.activeGoals,
        completed: goalsStats.completedGoals,
        progress: goalsStats.overallProgress,
        saved: goalsStats.totalSavedAmount,
        target: goalsStats.totalTargetAmount
      },
      topCategory: topCategory ? {
        name: topCategory.categoryName,
        amount: topCategory.total,
        percentage: topCategory.percentage
      } : null,
      totalTransactions: allTransactions.length
    };
  }

  /**
   * Exporta reporte a formato de texto
   */
  exportReportAsText(): string {
    const summary = this.getExecutiveSummary();
    const period = this.getCurrentMonthPeriod();
    
    let report = `
═══════════════════════════════════════════
      REPORTE FINANCIERO - STEPMONEY
═══════════════════════════════════════════

Período: ${period.label}
Generado: ${new Date().toLocaleString('es-CO')}

───────────────────────────────────────────
RESUMEN DEL MES ACTUAL
───────────────────────────────────────────

Ingresos:        $${summary.currentMonth.income.toLocaleString()}
Gastos:          $${summary.currentMonth.expense.toLocaleString()}
Balance:         $${summary.currentMonth.balance.toLocaleString()}
Transacciones:   ${summary.currentMonth.transactions}

───────────────────────────────────────────
PROMEDIOS (ÚLTIMOS 6 MESES)
───────────────────────────────────────────

Ingreso promedio:  $${summary.averages.income.toLocaleString()}
Gasto promedio:    $${summary.averages.expense.toLocaleString()}
Balance promedio:  $${summary.averages.balance.toLocaleString()}

───────────────────────────────────────────
METAS DE AHORRO
───────────────────────────────────────────

Total de metas:    ${summary.goals.total}
Activas:           ${summary.goals.active}
Completadas:       ${summary.goals.completed}
Progreso general:  ${summary.goals.progress.toFixed(1)}%
Ahorrado:          $${summary.goals.saved.toLocaleString()}
Objetivo total:    $${summary.goals.target.toLocaleString()}

${summary.topCategory ? `
───────────────────────────────────────────
CATEGORÍA MÁS GASTADA
───────────────────────────────────────────

${summary.topCategory.name}
Monto: $${summary.topCategory.amount.toLocaleString()}
Porcentaje: ${summary.topCategory.percentage.toFixed(1)}%
` : ''}

═══════════════════════════════════════════
Fin del Reporte
═══════════════════════════════════════════
    `;
    
    return report.trim();
  }

  /**
   * Descarga el reporte como archivo de texto
   */
  downloadTextReport() {
    const report = this.exportReportAsText();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_stepmoney_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}


