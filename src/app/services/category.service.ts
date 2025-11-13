import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Category, DEFAULT_CATEGORIES } from '../models/category.model';
import { StorageService } from './storage.service';

/**
 * Servicio de Gestión de Categorías
 * 
 * Maneja todas las operaciones relacionadas con categorías:
 * - Cargar categorías predefinidas
 * - Obtener categorías por tipo (ingreso/gasto)
 * - Buscar categoría por ID
 * - (Futuro) Crear categorías personalizadas
 * 
 * ¿Qué es BehaviorSubject?
 * - Es un tipo especial de Observable (flujo de datos reactivo)
 * - Emite valores a todos los componentes suscritos
 * - Siempre tiene un valor actual
 * - Cuando los datos cambian, todos los componentes se actualizan automáticamente
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  
  // Clave para almacenar categorías en localStorage
  private readonly STORAGE_KEY = 'stepmoney_categories';
  
  // BehaviorSubject que contiene todas las categorías
  // El signo $ al final es una convención para indicar que es un Observable
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  
  // Observable público para que los componentes se suscriban
  public categories$: Observable<Category[]> = this.categoriesSubject.asObservable();

  constructor(private storageService: StorageService) {
    console.log('✅ CategoryService inicializado');
    this.initializeCategories();
  }

  /**
   * Inicializa las categorías
   * Si no existen en el storage, carga las predefinidas
   */
  private async initializeCategories(): Promise<void> {
    try {
      // Intentamos cargar categorías guardadas
      const storedCategories = await this.storageService.get(this.STORAGE_KEY);
      
      if (storedCategories && storedCategories.length > 0) {
        // Si existen, las cargamos
        console.log('📂 Categorías cargadas desde almacenamiento:', storedCategories.length);
        this.categoriesSubject.next(storedCategories);
      } else {
        // Si no existen, cargamos las predefinidas
        console.log('🆕 Cargando categorías predefinidas');
        await this.saveCategories(DEFAULT_CATEGORIES);
        this.categoriesSubject.next(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error('❌ Error al inicializar categorías:', error);
      // En caso de error, cargamos las predefinidas
      this.categoriesSubject.next(DEFAULT_CATEGORIES);
    }
  }

  /**
   * Guarda las categorías en el almacenamiento
   */
  private async saveCategories(categories: Category[]): Promise<void> {
    try {
      await this.storageService.set(this.STORAGE_KEY, categories);
      console.log('💾 Categorías guardadas correctamente');
    } catch (error) {
      console.error('❌ Error al guardar categorías:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las categorías
   * @returns Array de categorías
   */
  getAllCategories(): Category[] {
    return this.categoriesSubject.getValue();
  }

  /**
   * Obtiene todas las categorías como Observable
   * Los componentes pueden suscribirse para recibir actualizaciones automáticas
   */
  getCategoriesObservable(): Observable<Category[]> {
    return this.categories$;
  }

  /**
   * Obtiene categorías filtradas por tipo
   * @param type - 'income' para ingresos, 'expense' para gastos
   * @returns Array de categorías del tipo especificado
   */
  getCategoriesByType(type: 'income' | 'expense'): Category[] {
    const allCategories = this.getAllCategories();
    return allCategories.filter(cat => cat.type === type);
  }

  /**
   * Busca una categoría por su ID
   * @param id - ID de la categoría a buscar
   * @returns La categoría encontrada o undefined
   */
  getCategoryById(id: string): Category | undefined {
    const allCategories = this.getAllCategories();
    return allCategories.find(cat => cat.id === id);
  }

  /**
   * Busca categorías por nombre (búsqueda parcial)
   * @param searchTerm - Término de búsqueda
   * @returns Array de categorías que coinciden
   */
  searchCategories(searchTerm: string): Category[] {
    const allCategories = this.getAllCategories();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allCategories.filter(cat => 
      cat.name.toLowerCase().includes(lowerSearchTerm)
    );
  }

  /**
   * Obtiene el conteo de categorías por tipo
   * @returns Objeto con el conteo de ingresos y gastos
   */
  getCategoriesCount(): { income: number; expense: number; total: number } {
    const allCategories = this.getAllCategories();
    
    const incomeCount = allCategories.filter(cat => cat.type === 'income').length;
    const expenseCount = allCategories.filter(cat => cat.type === 'expense').length;
    
    return {
      income: incomeCount,
      expense: expenseCount,
      total: allCategories.length
    };
  }

  /**
   * Reinicia las categorías a los valores predefinidos
   * ⚠️ Esto eliminará cualquier categoría personalizada
   */
  async resetToDefaults(): Promise<void> {
    try {
      await this.saveCategories(DEFAULT_CATEGORIES);
      this.categoriesSubject.next(DEFAULT_CATEGORIES);
      console.log('🔄 Categorías reiniciadas a valores predefinidos');
    } catch (error) {
      console.error('❌ Error al reiniciar categorías:', error);
      throw error;
    }
  }

  /**
   * (Funcionalidad Futura) Agregar una categoría personalizada
   * @param category - Nueva categoría a agregar
   */
  async addCustomCategory(category: Omit<Category, 'id'>): Promise<Category> {
    try {
      const allCategories = this.getAllCategories();
      
      // Generamos un ID único
      const newId = `cat-custom-${Date.now()}`;
      const newCategory: Category = {
        ...category,
        id: newId
      };
      
      // Agregamos la nueva categoría
      const updatedCategories = [...allCategories, newCategory];
      
      // Guardamos y actualizamos
      await this.saveCategories(updatedCategories);
      this.categoriesSubject.next(updatedCategories);
      
      console.log('✅ Categoría personalizada agregada:', newCategory.name);
      return newCategory;
    } catch (error) {
      console.error('❌ Error al agregar categoría personalizada:', error);
      throw error;
    }
  }
}


