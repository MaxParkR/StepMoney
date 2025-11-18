import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GoalService } from '../../services/goal.service';
import { 
  Goal, 
  CreateGoalDTO, 
  GoalProgress, 
  GoalContribution,
  DEFAULT_GOAL_ICONS,
  DEFAULT_GOAL_COLORS 
} from '../../models/goal.model';

/**
 * Página de Metas de Ahorro
 * 
 * Permite al usuario:
 * - Ver todas sus metas
 * - Crear nuevas metas
 * - Agregar dinero a las metas
 * - Editar y eliminar metas
 * - Ver el progreso de cada meta
 */
@Component({
  selector: 'app-goals',
  templateUrl: './goals.page.html',
  styleUrls: ['./goals.page.scss'],
  standalone: false
})
export class GoalsPage implements OnInit, OnDestroy {
  
  // Metas activas y completadas
  activeGoals: Goal[] = [];
  completedGoals: Goal[] = [];
  
  // Progreso de las metas
  goalsProgress: { [key: string]: GoalProgress } = {};
  
  // Estadísticas generales
  stats = {
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalTargetAmount: 0,
    totalSavedAmount: 0,
    overallProgress: 0
  };
  
  // Vista actual (activas o completadas)
  currentView: 'active' | 'completed' = 'active';
  
  // Estado del modal de nueva meta
  isAddingGoal = false;
  
  // Datos del formulario de nueva meta
  newGoal: CreateGoalDTO = {
    name: '',
    description: '',
    targetAmount: 0,
    deadline: '',
    icon: '',
    color: ''
  };
  
  // Iconos y colores disponibles
  availableIcons = DEFAULT_GOAL_ICONS;
  availableColors = DEFAULT_GOAL_COLORS;
  
  // Modal para contribuir a una meta
  isContributing = false;
  selectedGoalForContribution: Goal | null = null;
  contributionAmount = 0;
  contributionNote = '';
  
  // Loading
  isLoading = true;
  
  // Subject para destruir suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private goalService: GoalService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    console.log('🎯 Página de metas cargada');
    this.loadGoals();
    this.subscribeToChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga las metas
   */
  async loadGoals() {
    try {
      this.isLoading = true;
      
      this.activeGoals = this.goalService.getActiveGoals();
      this.completedGoals = this.goalService.getCompletedGoals();
      this.stats = this.goalService.getGoalsStatistics();
      
      // Calcular progreso de cada meta activa
      this.activeGoals.forEach(goal => {
        const progress = this.goalService.calculateGoalProgress(goal.id);
        if (progress) {
          this.goalsProgress[goal.id] = progress;
        }
      });
      
      console.log('📊 Metas cargadas:', {
        activas: this.activeGoals.length,
        completadas: this.completedGoals.length
      });
    } catch (error) {
      console.error('❌ Error al cargar metas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Se suscribe a cambios en las metas
   */
  private subscribeToChanges() {
    this.goalService.goals$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadGoals();
      });
  }

  /**
   * Cambia la vista entre activas y completadas
   */
  onViewChange(event: any) {
    this.currentView = event.detail.value;
  }

  /**
   * Abre el modal para crear nueva meta
   */
  openAddGoalModal() {
    this.isAddingGoal = true;
    this.resetNewGoal();
  }

  /**
   * Cierra el modal de nueva meta
   */
  closeAddGoalModal() {
    this.isAddingGoal = false;
    this.resetNewGoal();
  }

  /**
   * Reinicia el formulario de nueva meta
   */
  resetNewGoal() {
    // Selecciona icon y color aleatorios
    const randomIcon = this.availableIcons[Math.floor(Math.random() * this.availableIcons.length)];
    const randomColor = this.availableColors[Math.floor(Math.random() * this.availableColors.length)];
    
    this.newGoal = {
      name: '',
      description: '',
      targetAmount: 0,
      deadline: '',
      icon: randomIcon,
      color: randomColor
    };
  }

  /**
   * Guarda la nueva meta
   */
  async saveGoal() {
    // Validaciones
    if (!this.newGoal.name.trim()) {
      this.showAlert('Error', 'Por favor ingresa un nombre para la meta');
      return;
    }
    
    if (this.newGoal.targetAmount <= 0) {
      this.showAlert('Error', 'El monto objetivo debe ser mayor a cero');
      return;
    }

    try {
      await this.goalService.createGoal(this.newGoal);
      this.showAlert('¡Éxito!', 'Meta creada correctamente', 'success');
      this.closeAddGoalModal();
    } catch (error) {
      console.error('❌ Error al guardar meta:', error);
      this.showAlert('Error', 'No se pudo crear la meta');
    }
  }

  /**
   * Abre el modal para contribuir a una meta
   */
  openContributeModal(goal: Goal) {
    this.selectedGoalForContribution = goal;
    this.contributionAmount = 0;
    this.contributionNote = '';
    this.isContributing = true;
  }

  /**
   * Cierra el modal de contribución
   */
  closeContributeModal() {
    this.isContributing = false;
    this.selectedGoalForContribution = null;
    this.contributionAmount = 0;
    this.contributionNote = '';
  }

  /**
   * Guarda la contribución
   */
  async saveContribution() {
    if (!this.selectedGoalForContribution) return;
    
    if (this.contributionAmount <= 0) {
      this.showAlert('Error', 'El monto debe ser mayor a cero');
      return;
    }

    try {
      const contribution: GoalContribution = {
        goalId: this.selectedGoalForContribution.id,
        amount: this.contributionAmount,
        date: new Date().toISOString().split('T')[0],
        note: this.contributionNote
      };

      await this.goalService.contributeToGoal(contribution);
      this.showAlert('¡Genial!', `Has ahorrado ${this.formatCurrency(this.contributionAmount)} para tu meta`, 'success');
      this.closeContributeModal();
    } catch (error) {
      console.error('❌ Error al guardar contribución:', error);
      this.showAlert('Error', 'No se pudo guardar el ahorro');
    }
  }

  // Estado del modal de edición
isEditingGoal = false;

  // Define el tipo para la meta que se está editando.
  // Usa la misma estructura que la meta pero con `id` incluido
  editingGoal: {
    id: string;
    name: string;
    description?: string;
    targetAmount: number;
    deadline?: string;
    icon: string;
    color: string;
  } | null = null;

  /**
   * Abre el modal para editar una meta
   */
  openEditGoalModal(goal: Goal) {
    this.editingGoal = { 
      id: goal.id,
      name: goal.name,
      description: goal.description,
      targetAmount: goal.targetAmount,
      deadline: goal.deadline,
      icon: goal.icon,
      color: goal.color
    };
    this.isEditingGoal = true;
  }

  /**
   * Cierra el modal de edición
   */
  closeEditGoalModal() {
    this.isEditingGoal = false;
    this.editingGoal = null;
  }

  /**
   * Guarda los cambios de la meta editada
   */
  async saveEditedGoal() {
    if (!this.editingGoal) return;

    try {
      // Llama al servicio para actualizar la meta (asegúrate que updateGoal espera el formato correcto)
      const updatedGoal = await this.goalService.updateGoal(this.editingGoal.id, {
        name: this.editingGoal.name,
        description: this.editingGoal.description,
        targetAmount: this.editingGoal.targetAmount,
        deadline: this.editingGoal.deadline,
        icon: this.editingGoal.icon,
        color: this.editingGoal.color,
      });

      // Actualiza la lista local (si tienes una) o recarga metas
      // Por ejemplo, puedes llamar a un método para refrescar las metas:
      // this.loadGoals();

      this.isEditingGoal = false;
      this.editingGoal = null;

      // Opcional: muestra mensaje de éxito
      console.log('Meta actualizada:', updatedGoal);

    } catch (error) {
      console.error('Error al guardar meta editada:', error);
      // Aquí podrías mostrar un toast o alert con el error
    }
  }



  /**
   * Elimina una meta
   */
  async deleteGoal(goal: Goal) {
    const alert = await this.alertController.create({
      header: '¿Eliminar meta?',
      message: `¿Estás seguro de eliminar la meta "${goal.name}"? Los ${this.formatCurrency(goal.currentAmount)} ahorrados volverán a tu balance.`,
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
              await this.goalService.deleteGoal(goal.id);
              this.showAlert('Eliminada', 'Meta eliminada correctamente', 'success');
            } catch (error) {
              console.error('❌ Error al eliminar:', error);
              this.showAlert('Error', 'No se pudo eliminar la meta');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Obtiene el progreso de una meta
   */
  getProgress(goalId: string): GoalProgress | null {
    return this.goalsProgress[goalId] || null;
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
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Obtiene el color del estado de la meta
   */
  getStatusColor(progress: GoalProgress): string {
    switch (progress.status) {
      case 'completed': return 'success';
      case 'in-progress': return progress.isOnTrack ? 'primary' : 'warning';
      case 'overdue': return 'danger';
      default: return 'medium';
    }
  }

  /**
   * Obtiene el texto del estado
   */
  getStatusText(progress: GoalProgress): string {
    switch (progress.status) {
      case 'completed': return '¡Completada!';
      case 'in-progress': return progress.isOnTrack ? 'En progreso' : 'Retrasada';
      case 'overdue': return 'Vencida';
      case 'not-started': return 'Sin iniciar';
      default: return '';
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
    await this.loadGoals();
    event.target.complete();
  }
}