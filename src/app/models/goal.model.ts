/**
 * Modelo de Meta de Ahorro
 * Define la estructura de las metas financieras del usuario
 */
export interface Goal {
  id: string;              // Identificador único
  name: string;            // Nombre de la meta (ej: "Vacaciones")
  description?: string;    // Descripción opcional
  targetAmount: number;    // Monto objetivo a ahorrar
  currentAmount: number;   // Monto actual ahorrado
  deadline?: string;       // Fecha límite (formato ISO)
  icon: string;            // Icono de la meta
  color: string;           // Color de la meta
  createdAt: string;       // Fecha de creación
  updatedAt: string;       // Última actualización
  completed: boolean;      // Si la meta fue completada
  completedAt?: string;    // Fecha de completación
}

/**
 * Interface para crear una nueva meta
 */
export interface CreateGoalDTO {
  name: string;
  description?: string;
  targetAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

/**
 * Interface para actualizar una meta existente
 */
export interface UpdateGoalDTO {
  name?: string;
  description?: string;
  targetAmount?: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

/**
 * Interface para asignar dinero a una meta
 */
export interface GoalContribution {
  goalId: string;
  amount: number;
  date: string;
  note?: string;
}

/**
 * Estadísticas de progreso de una meta
 */
export interface GoalProgress {
  goalId: string;
  goalName: string;
  percentage: number;           // Porcentaje completado (0-100)
  remaining: number;            // Monto restante
  daysRemaining?: number;       // Días restantes hasta deadline
  dailyRequired?: number;       // Ahorro diario requerido
  isOnTrack: boolean;           // Si va por buen camino
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
}

/**
 * Iconos predefinidos para metas
 */
export const DEFAULT_GOAL_ICONS = [
  'airplane-outline',      // Viajes
  'home-outline',          // Casa
  'car-outline',           // Carro
  'school-outline',        // Educación
  'medical-outline',       // Salud
  'gift-outline',          // Regalo
  'phone-portrait-outline', // Teléfono
  'laptop-outline',        // Laptop
  'wallet-outline',        // Ahorro general
  'heart-outline',         // Personal
  'fitness-outline',       // Deporte
  'pizza-outline'          // Otro
];

/**
 * Colores predefinidos para metas
 */
export const DEFAULT_GOAL_COLORS = [
  '#3CA8E8',  // Azul primario
  '#2DD36F',  // Verde
  '#FFC409',  // Amarillo
  '#EB445A',  // Rojo
  '#3DC2FF',  // Azul claro
  '#C77CFF',  // Púrpura
  '#F77737',  // Naranja
  '#7AC1FF',  // Azul suave
  '#56C991',  // Verde suave
  '#F4A79D'   // Rosa
];


