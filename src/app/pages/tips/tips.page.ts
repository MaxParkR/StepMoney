import { Component, OnInit } from '@angular/core';
import { FinancialTip, DEFAULT_TIPS, TipCategory } from '../../models/tip.model';

/**
 * Página de Consejos Financieros
 * 
 * Muestra una biblioteca de consejos y tips sobre finanzas personales
 * para educar al usuario en temas de ahorro, presupuesto, inversión, etc.
 */
@Component({
  selector: 'app-tips',
  templateUrl: './tips.page.html',
  styleUrls: ['./tips.page.scss'],
  standalone: false
})
export class TipsPage implements OnInit {
  
  // Todos los consejos disponibles
  allTips: FinancialTip[] = DEFAULT_TIPS;
  
  // Consejos filtrados
  filteredTips: FinancialTip[] = [];
  
  // Categoría seleccionada para filtrar
  selectedCategory: TipCategory | 'all' = 'all';
  
  // Categorías disponibles
  categories: { value: TipCategory | 'all', label: string, icon: string }[] = [
    { value: 'all', label: 'Todos', icon: 'apps' },
    { value: 'saving', label: 'Ahorro', icon: 'wallet' },
    { value: 'budgeting', label: 'Presupuesto', icon: 'calculator' },
    { value: 'investing', label: 'Inversión', icon: 'trending-up' },
    { value: 'debt', label: 'Deudas', icon: 'card' },
    { value: 'emergency', label: 'Emergencias', icon: 'shield-checkmark' },
    { value: 'general', label: 'General', icon: 'book' }
  ];
  
  // Término de búsqueda
  searchTerm = '';

  constructor() {}

  ngOnInit() {
    console.log('💡 Página de consejos cargada');
    this.filteredTips = [...this.allTips];
  }

  /**
   * Filtra los consejos por categoría
   */
  filterByCategory(category: TipCategory | 'all') {
    this.selectedCategory = category;
    this.applyFilters();
  }

  /**
   * Busca consejos por término
   */
  onSearch(event: any) {
    this.searchTerm = event.detail.value.toLowerCase();
    this.applyFilters();
  }

  /**
   * Aplica todos los filtros activos
   */
  applyFilters() {
    let tips = [...this.allTips];
    
    // Filtrar por categoría
    if (this.selectedCategory !== 'all') {
      tips = tips.filter(tip => tip.category === this.selectedCategory);
    }
    
    // Filtrar por búsqueda
    if (this.searchTerm) {
      tips = tips.filter(tip => 
        tip.title.toLowerCase().includes(this.searchTerm) ||
        tip.content.toLowerCase().includes(this.searchTerm) ||
        (tip.tags && tip.tags.some(tag => tag.toLowerCase().includes(this.searchTerm)))
      );
    }
    
    this.filteredTips = tips;
  }

  /**
   * Obtiene el badge de color según la categoría
   */
  getCategoryColor(category: TipCategory): string {
    const colors: { [key in TipCategory]: string } = {
      saving: 'success',
      budgeting: 'primary',
      investing: 'tertiary',
      debt: 'warning',
      emergency: 'danger',
      general: 'medium'
    };
    return colors[category] || 'medium';
  }

  /**
   * Obtiene el gradiente según la categoría
   */
  getCategoryGradient(category: TipCategory): string {
    const gradients: { [key in TipCategory]: string } = {
      saving: 'linear-gradient(135deg, #81FBB8 0%, #28C76F 100%)',
      budgeting: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      investing: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      debt: 'linear-gradient(135deg, #FFB75E 0%, #ED8F03 100%)',
      emergency: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
      general: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    };
    return gradients[category] || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
  }

  /**
   * Obtiene el badge de color según la dificultad
   */
  getDifficultyColor(difficulty?: string): string {
    if (!difficulty) return 'medium';
    const colors: { [key: string]: string } = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'danger'
    };
    return colors[difficulty] || 'medium';
  }

  /**
   * Traduce la dificultad al español
   */
  translateDifficulty(difficulty?: string): string {
    if (!difficulty) return 'Básico';
    const translations: { [key: string]: string } = {
      beginner: 'Básico',
      intermediate: 'Intermedio',
      advanced: 'Avanzado'
    };
    return translations[difficulty] || 'Básico';
  }

  /**
   * Obtiene el label de la categoría
   */
  getCategoryLabel(category: TipCategory): string {
    const found = this.categories.find(c => c.value === category);
    return found ? found.label : category;
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.selectedCategory = 'all';
    this.searchTerm = '';
    this.filteredTips = [...this.allTips];
  }
}
