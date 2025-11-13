/**
 * Modelo de Consejo Financiero
 * Define la estructura de los consejos educativos
 */
export interface FinancialTip {
  id: string;
  title: string;              // Título del consejo
  content: string;            // Contenido del consejo
  category: TipCategory;      // Categoría del consejo
  icon: string;               // Icono
  readTime?: number;          // Tiempo estimado de lectura (minutos)
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];            // Etiquetas para búsqueda
}

/**
 * Categorías de consejos
 */
export type TipCategory = 
  | 'saving'          // Ahorro
  | 'budgeting'       // Presupuesto
  | 'investing'       // Inversión
  | 'debt'            // Deudas
  | 'emergency'       // Fondo de emergencia
  | 'general';        // General

/**
 * Consejos predefinidos para la aplicación
 */
export const DEFAULT_TIPS: FinancialTip[] = [
  {
    id: 'tip-1',
    title: 'Regla del 50/30/20',
    content: 'Divide tu ingreso mensual en: 50% para necesidades básicas (vivienda, comida, transporte), 30% para gustos personales (entretenimiento, hobbies), y 20% para ahorro e inversión. Esta regla simple te ayuda a mantener un equilibrio financiero saludable.',
    category: 'budgeting',
    icon: 'pie-chart-outline',
    readTime: 2,
    difficulty: 'beginner',
    tags: ['presupuesto', 'planificación', 'ahorro']
  },
  {
    id: 'tip-2',
    title: 'Fondo de Emergencia',
    content: 'Crea un fondo de emergencia que cubra entre 3 y 6 meses de tus gastos básicos. Este colchón financiero te protegerá ante imprevistos como pérdida de empleo, gastos médicos o reparaciones urgentes. Guárdalo en una cuenta de fácil acceso pero separada de tus gastos diarios.',
    category: 'emergency',
    icon: 'shield-checkmark-outline',
    readTime: 3,
    difficulty: 'beginner',
    tags: ['emergencia', 'ahorro', 'seguridad']
  },
  {
    id: 'tip-3',
    title: 'Elimina Deudas Pequeñas Primero',
    content: 'Método "Bola de Nieve": Paga primero las deudas más pequeñas mientras mantienes pagos mínimos en las demás. Al eliminar deudas pequeñas rápidamente, ganarás motivación y liberarás dinero para atacar las siguientes. Este método es psicológicamente efectivo.',
    category: 'debt',
    icon: 'snow-outline',
    readTime: 3,
    difficulty: 'intermediate',
    tags: ['deudas', 'estrategia', 'finanzas']
  },
  {
    id: 'tip-4',
    title: 'Automatiza tu Ahorro',
    content: 'Configura transferencias automáticas de tu cuenta principal a una cuenta de ahorros justo después de recibir tu salario. Al "pagarte a ti mismo primero", el ahorro se convierte en prioridad y no en lo que sobra a fin de mes. Incluso pequeñas cantidades sumadas constantemente generan grandes resultados.',
    category: 'saving',
    icon: 'reload-outline',
    readTime: 2,
    difficulty: 'beginner',
    tags: ['ahorro', 'automatización', 'disciplina']
  },
  {
    id: 'tip-5',
    title: 'Registra TODOS tus Gastos',
    content: 'Lleva un registro detallado de cada peso que gastas durante un mes. Te sorprenderá descubrir en qué se va tu dinero. Los gastos pequeños y frecuentes (café, apps, delivery) pueden sumar miles al mes. Con conciencia sobre tus gastos, puedes tomar mejores decisiones.',
    category: 'budgeting',
    icon: 'document-text-outline',
    readTime: 2,
    difficulty: 'beginner',
    tags: ['presupuesto', 'control', 'conciencia']
  },
  {
    id: 'tip-6',
    title: 'Invierte en tu Educación Financiera',
    content: 'Dedica tiempo regularmente a aprender sobre finanzas personales. Lee libros, escucha podcasts, toma cursos gratuitos online. El conocimiento financiero es la inversión más rentable que puedes hacer, pues te acompañará toda la vida y te ayudará a tomar mejores decisiones con tu dinero.',
    category: 'general',
    icon: 'library-outline',
    readTime: 2,
    difficulty: 'beginner',
    tags: ['educación', 'aprendizaje', 'crecimiento']
  },
  {
    id: 'tip-7',
    title: 'Compara Precios Antes de Comprar',
    content: 'Antes de realizar una compra importante, compara precios en diferentes tiendas y plataformas online. Espera 24-48 horas antes de compras no esenciales para evitar decisiones impulsivas. Pregúntate: ¿Realmente lo necesito? ¿Puedo conseguirlo más barato? ¿Tengo espacio/tiempo para usarlo?',
    category: 'general',
    icon: 'search-outline',
    readTime: 3,
    difficulty: 'beginner',
    tags: ['compras', 'ahorro', 'decisiones']
  },
  {
    id: 'tip-8',
    title: 'Establece Metas SMART',
    content: 'Define metas financieras Específicas, Medibles, Alcanzables, Relevantes y con Tiempo definido. En lugar de "quiero ahorrar más", establece "ahorraré $500,000 en 6 meses para un viaje". Las metas claras te mantienen motivado y facilitan el seguimiento de tu progreso.',
    category: 'saving',
    icon: 'flag-outline',
    readTime: 3,
    difficulty: 'intermediate',
    tags: ['metas', 'planificación', 'motivación']
  },
  {
    id: 'tip-9',
    title: 'Revisa tu Progreso Mensualmente',
    content: 'Dedica 30 minutos al mes para revisar tus finanzas: ¿cumpliste tu presupuesto? ¿avanzaste en tus metas? ¿hubo gastos innecesarios? Esta revisión regular te ayuda a mantener el rumbo, celebrar pequeños logros y ajustar lo necesario. Es como un chequeo médico para tus finanzas.',
    category: 'general',
    icon: 'calendar-outline',
    readTime: 2,
    difficulty: 'beginner',
    tags: ['revisión', 'seguimiento', 'mejora']
  },
  {
    id: 'tip-10',
    title: 'Diversifica tus Ingresos',
    content: 'No dependas de una sola fuente de ingresos. Explora habilidades que puedas monetizar: freelancing, venta de productos, tutorías, inversiones. Múltiples fuentes de ingreso te dan seguridad financiera y acelerar el logro de tus metas. Comienza con algo pequeño y escalable.',
    category: 'investing',
    icon: 'trending-up-outline',
    readTime: 4,
    difficulty: 'intermediate',
    tags: ['ingresos', 'freelance', 'diversificación']
  }
];


