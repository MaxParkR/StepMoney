/**
 * Modelo de Categoría
 * Define la estructura de las categorías para clasificar transacciones
 */
export interface Category {
  id: string;              // Identificador único
  name: string;            // Nombre de la categoría (ej: "Alimentación")
  icon: string;            // Icono de Ionic (ej: "fast-food-outline")
  color: string;           // Color en formato hexadecimal (ej: "#3CA8E8")
  type: 'income' | 'expense'; // Tipo: ingreso o gasto
}

/**
 * Categorías predefinidas para la aplicación
 * Estas serán las categorías iniciales disponibles
 */
export const DEFAULT_CATEGORIES: Category[] = [
  // Categorías de GASTOS
  {
    id: 'cat-1',
    name: 'Alimentación',
    icon: 'fast-food-outline',
    color: '#FF6B6B',
    type: 'expense'
  },
  {
    id: 'cat-2',
    name: 'Transporte',
    icon: 'car-outline',
    color: '#4ECDC4',
    type: 'expense'
  },
  {
    id: 'cat-3',
    name: 'Entretenimiento',
    icon: 'game-controller-outline',
    color: '#95E1D3',
    type: 'expense'
  },
  {
    id: 'cat-4',
    name: 'Salud',
    icon: 'medical-outline',
    color: '#F38181',
    type: 'expense'
  },
  {
    id: 'cat-5',
    name: 'Educación',
    icon: 'school-outline',
    color: '#AA96DA',
    type: 'expense'
  },
  {
    id: 'cat-6',
    name: 'Servicios',
    icon: 'receipt-outline',
    color: '#FCBAD3',
    type: 'expense'
  },
  {
    id: 'cat-7',
    name: 'Compras',
    icon: 'cart-outline',
    color: '#FFFFD2',
    type: 'expense'
  },
  {
    id: 'cat-8',
    name: 'Otros Gastos',
    icon: 'ellipsis-horizontal-outline',
    color: '#A8D8EA',
    type: 'expense'
  },
  // Categorías de INGRESOS
  {
    id: 'cat-9',
    name: 'Salario',
    icon: 'cash-outline',
    color: '#2DD36F',
    type: 'income'
  },
  {
    id: 'cat-10',
    name: 'Freelance',
    icon: 'laptop-outline',
    color: '#3DC2FF',
    type: 'income'
  },
  {
    id: 'cat-11',
    name: 'Inversiones',
    icon: 'trending-up-outline',
    color: '#FFC409',
    type: 'income'
  },
  {
    id: 'cat-12',
    name: 'Otros Ingresos',
    icon: 'add-circle-outline',
    color: '#92949C',
    type: 'income'
  }
];



