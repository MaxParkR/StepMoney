import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  Transaction, 
  CreateTransactionDTO, 
  TransactionFilter,
  TransactionSummary,
  CategorySummary 
} from '../models/transaction.model';
import { StorageService } from './storage.service';
import { CategoryService } from './category.service';

/**
 * Servicio de Gestión de Transacciones
 * 
 * Este es el servicio más importante de la app. Maneja:
 * - Crear, leer, actualizar y eliminar transacciones (CRUD)
 * - Calcular balances e ingresos/gastos totales
 * - Filtrar transacciones por diferentes criterios
 * - Generar resúmenes y estadísticas
 * - Obtener transacciones por rango de fechas
 */
@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  
  private readonly STORAGE_KEY = 'stepmoney_transactions';
  
  // BehaviorSubject con todas las transacciones
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$: Observable<Transaction[]> = this.transactionsSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private categoryService: CategoryService
  ) {
    console.log('✅ TransactionService inicializado');
    this.loadTransactions();
  }

  /**
   * Carga las transacciones desde el almacenamiento
   */
  private async loadTransactions(): Promise<void> {
    try {
      const storedTransactions = await this.storageService.get(this.STORAGE_KEY);
      
      if (storedTransactions && Array.isArray(storedTransactions)) {
        console.log('📂 Transacciones cargadas:', storedTransactions.length);
        this.transactionsSubject.next(storedTransactions);
      } else {
        console.log('📭 No hay transacciones guardadas');
        this.transactionsSubject.next([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar transacciones:', error);
      this.transactionsSubject.next([]);
    }
  }

  /**
   * Guarda las transacciones en el almacenamiento
   */
  private async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await this.storageService.set(this.STORAGE_KEY, transactions);
      console.log('💾 Transacciones guardadas correctamente');
    } catch (error) {
      console.error('❌ Error al guardar transacciones:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva transacción
   * @param dto - Datos de la transacción a crear
   * @returns La transacción creada
   */
  async createTransaction(dto: CreateTransactionDTO): Promise<Transaction> {
    try {
      // Obtenemos la información de la categoría
      const category = this.categoryService.getCategoryById(dto.categoryId);
      
      if (!category) {
        throw new Error(`Categoría con ID ${dto.categoryId} no encontrada`);
      }

      // Creamos la nueva transacción
      const newTransaction: Transaction = {
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: dto.type,
        amount: dto.amount,
        categoryId: dto.categoryId,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        date: dto.date,
        description: dto.description,
        createdAt: new Date().toISOString()
      };

      // Agregamos la transacción a la lista
      const currentTransactions = this.transactionsSubject.getValue();
      const updatedTransactions = [...currentTransactions, newTransaction];
      
      // Guardamos y actualizamos
      await this.saveTransactions(updatedTransactions);
      this.transactionsSubject.next(updatedTransactions);
      
      console.log('✅ Transacción creada:', newTransaction);
      return newTransaction;
    } catch (error) {
      console.error('❌ Error al crear transacción:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las transacciones
   */
  getAllTransactions(): Transaction[] {
    return this.transactionsSubject.getValue();
  }

  /**
   * Obtiene una transacción por su ID
   */
  getTransactionById(id: string): Transaction | undefined {
    const allTransactions = this.getAllTransactions();
    return allTransactions.find(txn => txn.id === id);
  }

  /**
   * Actualiza una transacción existente
   */
  async updateTransaction(id: string, updates: Partial<CreateTransactionDTO>): Promise<Transaction> {
    try {
      const allTransactions = this.getAllTransactions();
      const index = allTransactions.findIndex(txn => txn.id === id);
      
      if (index === -1) {
        throw new Error(`Transacción con ID ${id} no encontrada`);
      }

      const existingTransaction = allTransactions[index];
      
      // Si se cambió la categoría, actualizamos su información
      let categoryInfo = {
        categoryId: existingTransaction.categoryId,
        categoryName: existingTransaction.categoryName,
        categoryIcon: existingTransaction.categoryIcon,
        categoryColor: existingTransaction.categoryColor
      };

      if (updates.categoryId && updates.categoryId !== existingTransaction.categoryId) {
        const category = this.categoryService.getCategoryById(updates.categoryId);
        if (category) {
          categoryInfo = {
            categoryId: category.id,
            categoryName: category.name,
            categoryIcon: category.icon,
            categoryColor: category.color
          };
        }
      }

      // Creamos la transacción actualizada
      const updatedTransaction: Transaction = {
        ...existingTransaction,
        ...updates,
        ...categoryInfo,
        id: existingTransaction.id,
        createdAt: existingTransaction.createdAt
      };

      // Actualizamos en el array
      allTransactions[index] = updatedTransaction;
      
      // Guardamos y actualizamos
      await this.saveTransactions(allTransactions);
      this.transactionsSubject.next(allTransactions);
      
      console.log('✅ Transacción actualizada:', updatedTransaction);
      return updatedTransaction;
    } catch (error) {
      console.error('❌ Error al actualizar transacción:', error);
      throw error;
    }
  }

  /**
   * Elimina una transacción
   */
  async deleteTransaction(id: string): Promise<void> {
    try {
      const allTransactions = this.getAllTransactions();
      const filteredTransactions = allTransactions.filter(txn => txn.id !== id);
      
      if (filteredTransactions.length === allTransactions.length) {
        throw new Error(`Transacción con ID ${id} no encontrada`);
      }

      await this.saveTransactions(filteredTransactions);
      this.transactionsSubject.next(filteredTransactions);
      
      console.log('🗑️ Transacción eliminada:', id);
    } catch (error) {
      console.error('❌ Error al eliminar transacción:', error);
      throw error;
    }
  }

  /**
   * Filtra transacciones según criterios
   */
  filterTransactions(filter: TransactionFilter): Transaction[] {
    let transactions = this.getAllTransactions();

    // Filtrar por tipo
    if (filter.type && filter.type !== 'all') {
      transactions = transactions.filter(txn => txn.type === filter.type);
    }

    // Filtrar por categoría
    if (filter.categoryId) {
      transactions = transactions.filter(txn => txn.categoryId === filter.categoryId);
    }

    // Filtrar por rango de fechas
    if (filter.startDate) {
      transactions = transactions.filter(txn => txn.date >= filter.startDate!);
    }
    if (filter.endDate) {
      transactions = transactions.filter(txn => txn.date <= filter.endDate!);
    }

    // Filtrar por rango de montos
    if (filter.minAmount !== undefined) {
      transactions = transactions.filter(txn => txn.amount >= filter.minAmount!);
    }
    if (filter.maxAmount !== undefined) {
      transactions = transactions.filter(txn => txn.amount <= filter.maxAmount!);
    }

    return transactions;
  }

  /**
   * Obtiene el resumen de transacciones
   * Calcula totales, balances y resúmenes por categoría
   */
  getTransactionsSummary(filter?: TransactionFilter): TransactionSummary {
    const transactions = filter ? this.filterTransactions(filter) : this.getAllTransactions();

    // Calculamos totales
    const totalIncome = transactions
      .filter(txn => txn.type === 'income')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalExpense = transactions
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const balance = totalIncome - totalExpense;

    // Resumen por categoría
    const categoryMap = new Map<string, CategorySummary>();

    transactions.forEach(txn => {
      if (!categoryMap.has(txn.categoryId)) {
        categoryMap.set(txn.categoryId, {
          categoryId: txn.categoryId,
          categoryName: txn.categoryName,
          categoryIcon: txn.categoryIcon,
          categoryColor: txn.categoryColor,
          total: 0,
          percentage: 0,
          count: 0
        });
      }

      const summary = categoryMap.get(txn.categoryId)!;
      summary.total += txn.amount;
      summary.count += 1;
    });

    // Calculamos porcentajes
    const byCategory: CategorySummary[] = Array.from(categoryMap.values());
    const totalForPercentage = totalExpense > 0 ? totalExpense : totalIncome;

    byCategory.forEach(summary => {
      summary.percentage = totalForPercentage > 0 
        ? (summary.total / totalForPercentage) * 100 
        : 0;
    });

    // Ordenamos por total descendente
    byCategory.sort((a, b) => b.total - a.total);

    return {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length,
      byCategory
    };
  }

  /**
   * Obtiene transacciones del mes actual
   */
  getCurrentMonthTransactions(): Transaction[] {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.filterTransactions({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    });
  }

  /**
   * Obtiene el resumen del mes actual
   */
  getCurrentMonthSummary(): TransactionSummary {
    const monthTransactions = this.getCurrentMonthTransactions();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    return this.getTransactionsSummary({
      startDate: startOfMonth,
      endDate: endOfMonth
    });
  }

  /**
   * Elimina todas las transacciones
   * ⚠️ Usar con precaución
   */
  async clearAllTransactions(): Promise<void> {
    try {
      await this.saveTransactions([]);
      this.transactionsSubject.next([]);
      console.log('🧹 Todas las transacciones eliminadas');
    } catch (error) {
      console.error('❌ Error al eliminar transacciones:', error);
      throw error;
    }
  }
}


