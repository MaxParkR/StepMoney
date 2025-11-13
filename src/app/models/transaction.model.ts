/**
 * Modelo de Transacción
 * Define la estructura de cada ingreso o gasto registrado
 */
export interface Transaction {
  id: string;                    // Identificador único
  type: 'income' | 'expense';    // Tipo de transacción
  amount: number;                // Monto de la transacción
  categoryId: string;            // ID de la categoría asociada
  categoryName: string;          // Nombre de la categoría (para mostrar)
  categoryIcon: string;          // Icono de la categoría
  categoryColor: string;         // Color de la categoría
  date: string;                  // Fecha en formato ISO (ej: "2025-11-12")
  description?: string;          // Descripción opcional
  createdAt: string;             // Fecha de creación del registro
}

/**
 * Interface para crear una nueva transacción
 * Campos necesarios al crear una transacción
 */
export interface CreateTransactionDTO {
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  date: string;
  description?: string;
}

/**
 * Interface para filtros de transacciones
 * Útil para búsquedas y reportes
 */
export interface TransactionFilter {
  type?: 'income' | 'expense' | 'all';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Interface para resumen de transacciones
 * Usado en el Dashboard y reportes
 */
export interface TransactionSummary {
  totalIncome: number;      // Total de ingresos
  totalExpense: number;     // Total de gastos
  balance: number;          // Balance (ingresos - gastos)
  transactionCount: number; // Cantidad de transacciones
  byCategory: CategorySummary[]; // Resumen por categoría
}

/**
 * Resumen por categoría
 */
export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentage: number;       // Porcentaje del total
  count: number;            // Cantidad de transacciones
}


