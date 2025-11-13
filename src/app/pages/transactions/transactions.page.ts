import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { Transaction, CreateTransactionDTO, TransactionFilter } from '../../models/transaction.model';
import { Category } from '../../models/category.model';

/**
 * Página de Transacciones
 * 
 * Permite al usuario:
 * - Ver todas sus transacciones
 * - Filtrar por tipo (ingresos/gastos)
 * - Crear nuevas transacciones
 * - Editar transacciones existentes
 * - Eliminar transacciones
 */
@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  standalone: false
})
export class TransactionsPage implements OnInit, OnDestroy {
  
  // Lista de todas las transacciones
  transactions: Transaction[] = [];
  
  // Transacciones filtradas (las que se muestran)
  filteredTransactions: Transaction[] = [];
  
  // Categorías disponibles
  categories: Category[] = [];
  
  // Filtro actual
  currentFilter: 'all' | 'income' | 'expense' = 'all';
  
  // Estado del modal de nueva transacción
  isAddingTransaction = false;
  
  // Datos del formulario de nueva transacción
  newTransaction: CreateTransactionDTO = {
    type: 'expense',
    amount: 0,
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  };
  
  // Categorías filtradas según el tipo seleccionado
  availableCategories: Category[] = [];
  
  // Loading
  isLoading = true;
  
  // Subject para destruir suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private alertController: AlertController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    console.log('💳 Página de transacciones cargada');
    this.loadData();
    this.subscribeToChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos iniciales
   */
  async loadData() {
    try {
      this.isLoading = true;
      
      // Cargar transacciones
      this.transactions = this.transactionService.getAllTransactions();
      
      // Cargar categorías
      this.categories = this.categoryService.getAllCategories();
      
      // Aplicar filtro
      this.applyFilter();
      
      // Actualizar categorías disponibles
      this.updateAvailableCategories();
      
      console.log('📊 Transacciones cargadas:', this.transactions.length);
    } catch (error) {
      console.error('❌ Error al cargar transacciones:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Se suscribe a cambios en los datos
   */
  private subscribeToChanges() {
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        this.transactions = transactions;
        this.applyFilter();
      });
  }

  /**
   * Aplica el filtro seleccionado
   */
  applyFilter() {
    if (this.currentFilter === 'all') {
      this.filteredTransactions = [...this.transactions];
    } else {
      this.filteredTransactions = this.transactions.filter(
        t => t.type === this.currentFilter
      );
    }
    
    // Ordenar por fecha (más reciente primero)
    this.filteredTransactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  /**
   * Cambia el filtro
   */
  onFilterChange(event: any) {
    this.currentFilter = event.detail.value;
    this.applyFilter();
  }

  /**
   * Abre el modal para crear nueva transacción
   */
  openAddTransactionModal() {
    this.isAddingTransaction = true;
    this.resetNewTransaction();
  }

  /**
   * Cierra el modal de nueva transacción
   */
  closeAddTransactionModal() {
    this.isAddingTransaction = false;
    this.resetNewTransaction();
  }

  /**
   * Reinicia el formulario de nueva transacción
   */
  resetNewTransaction() {
    this.newTransaction = {
      type: 'expense',
      amount: 0,
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    };
    this.updateAvailableCategories();
  }

  /**
   * Actualiza las categorías disponibles según el tipo
   */
  updateAvailableCategories() {
    this.availableCategories = this.categoryService.getCategoriesByType(
      this.newTransaction.type
    );
    
    // Si había una categoría seleccionada del tipo anterior, limpiarla
    if (this.newTransaction.categoryId) {
      const category = this.categoryService.getCategoryById(this.newTransaction.categoryId);
      if (!category || category.type !== this.newTransaction.type) {
        this.newTransaction.categoryId = '';
      }
    }
  }

  /**
   * Cuando cambia el tipo de transacción
   */
  onTypeChange() {
    this.updateAvailableCategories();
  }

  /**
   * Guarda la nueva transacción
   */
  async saveTransaction() {
    // Validaciones
    if (!this.newTransaction.categoryId) {
      this.showAlert('Error', 'Por favor selecciona una categoría');
      return;
    }
    
    if (this.newTransaction.amount <= 0) {
      this.showAlert('Error', 'El monto debe ser mayor a cero');
      return;
    }

    try {
      await this.transactionService.createTransaction(this.newTransaction);
      this.showAlert('¡Éxito!', 'Transacción guardada correctamente', 'success');
      this.closeAddTransactionModal();
    } catch (error) {
      console.error('❌ Error al guardar transacción:', error);
      this.showAlert('Error', 'No se pudo guardar la transacción');
    }
  }

  /**
   * Elimina una transacción
   */
  async deleteTransaction(transaction: Transaction) {
    const alert = await this.alertController.create({
      header: '¿Eliminar transacción?',
      message: `¿Estás seguro de eliminar esta transacción de ${this.formatCurrency(transaction.amount)}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.transactionService.deleteTransaction(transaction.id);
              this.showAlert('Eliminada', 'Transacción eliminada correctamente', 'success');
            } catch (error) {
              console.error('❌ Error al eliminar:', error);
              this.showAlert('Error', 'No se pudo eliminar la transacción');
            }
          }
        }
      ]
    });

    await alert.present();
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
   * Formatea una fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Comparar solo las fechas, no las horas
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Hoy';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Ayer';
    } else {
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date);
    }
  }

  /**
   * Muestra una alerta
   */
  async showAlert(header: string, message: string, type: 'success' | 'error' = 'error') {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Refresca la página
   */
  async doRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  /**
   * Agrupa transacciones por fecha
   */
  getGroupedTransactions(): { date: string, transactions: Transaction[] }[] {
    const groups: { [key: string]: Transaction[] } = {};
    
    this.filteredTransactions.forEach(transaction => {
      const dateKey = this.formatDate(transaction.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });
    
    return Object.keys(groups).map(date => ({
      date,
      transactions: groups[date]
    }));
  }

  /**
   * Calcula el total del día
   */
  getDayTotal(transactions: Transaction[]): { income: number, expense: number } {
    return transactions.reduce((acc, t) => {
      if (t.type === 'income') {
        acc.income += t.amount;
      } else {
        acc.expense += t.amount;
      }
      return acc;
    }, { income: 0, expense: 0 });
  }
}
