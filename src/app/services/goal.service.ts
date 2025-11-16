import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  Goal, 
  CreateGoalDTO, 
  UpdateGoalDTO,
  GoalContribution,
  GoalProgress,
  DEFAULT_GOAL_COLORS,
  DEFAULT_GOAL_ICONS 
} from '../models/goal.model';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';

/**
 * Servicio de Gestión de Metas de Ahorro
 * 
 * Maneja todo lo relacionado con las metas financieras:
 * - CRUD de metas
 * - Asignación de dinero a metas
 * - Cálculo de progreso
 * - Estadísticas y análisis
 * - Verificación de cumplimiento de metas
 */
@Injectable({
  providedIn: 'root'
})
export class GoalService {
  
  private readonly STORAGE_KEY = 'stepmoney_goals';
  private readonly CONTRIBUTIONS_KEY = 'stepmoney_goal_contributions';
  
  private goalsSubject = new BehaviorSubject<Goal[]>([]);
  public goals$: Observable<Goal[]> = this.goalsSubject.asObservable();
  
  private contributionsSubject = new BehaviorSubject<GoalContribution[]>([]);
  public contributions$: Observable<GoalContribution[]> = this.contributionsSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService
  ) {
    console.log('✅ GoalService inicializado');
    this.loadGoals();
    this.loadContributions();
  }

  /**
   * Carga las metas desde el almacenamiento
   */
  private async loadGoals(): Promise<void> {
    try {
      const storedGoals = await this.storageService.get(this.STORAGE_KEY);
      
      if (storedGoals && Array.isArray(storedGoals)) {
        console.log('📂 Metas cargadas:', storedGoals.length);
        this.goalsSubject.next(storedGoals);
      } else {
        console.log('📭 No hay metas guardadas');
        this.goalsSubject.next([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar metas:', error);
      this.goalsSubject.next([]);
    }
  }

  /**
   * Carga las contribuciones desde el almacenamiento
   */
  private async loadContributions(): Promise<void> {
    try {
      const storedContributions = await this.storageService.get(this.CONTRIBUTIONS_KEY);
      
      if (storedContributions && Array.isArray(storedContributions)) {
        this.contributionsSubject.next(storedContributions);
      } else {
        this.contributionsSubject.next([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar contribuciones:', error);
      this.contributionsSubject.next([]);
    }
  }

  /**
   * Guarda las metas en el almacenamiento
   */
  private async saveGoals(goals: Goal[]): Promise<void> {
    try {
      await this.storageService.set(this.STORAGE_KEY, goals);
      console.log('💾 Metas guardadas correctamente');
    } catch (error) {
      console.error('❌ Error al guardar metas:', error);
      throw error;
    }
  }

  /**
   * Guarda las contribuciones en el almacenamiento
   */
  private async saveContributions(contributions: GoalContribution[]): Promise<void> {
    try {
      await this.storageService.set(this.CONTRIBUTIONS_KEY, contributions);
    } catch (error) {
      console.error('❌ Error al guardar contribuciones:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva meta
   */
  async createGoal(dto: CreateGoalDTO): Promise<Goal> {
    try {
      const now = new Date().toISOString();
      
      // Asignamos un icono y color aleatorio si no se proporcionan
      const icon = dto.icon || this.getRandomIcon();
      const color = dto.color || this.getRandomColor();

      const newGoal: Goal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: dto.name,
        description: dto.description,
        targetAmount: dto.targetAmount,
        currentAmount: 0,
        deadline: dto.deadline,
        icon: icon,
        color: color,
        createdAt: now,
        updatedAt: now,
        completed: false
      };

      const currentGoals = this.goalsSubject.getValue();
      const updatedGoals = [...currentGoals, newGoal];
      
      await this.saveGoals(updatedGoals);
      this.goalsSubject.next(updatedGoals);
      
      console.log('✅ Meta creada:', newGoal);
      return newGoal;
    } catch (error) {
      console.error('❌ Error al crear meta:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las metas
   */
  getAllGoals(): Goal[] {
    return this.goalsSubject.getValue();
  }

  /**
   * Obtiene una meta por su ID
   */
  getGoalById(id: string): Goal | undefined {
    const allGoals = this.getAllGoals();
    return allGoals.find(goal => goal.id === id);
  }

  /**
   * Obtiene metas activas (no completadas)
   */
  getActiveGoals(): Goal[] {
    return this.getAllGoals().filter(goal => !goal.completed);
  }

  /**
   * Obtiene metas completadas
   */
  getCompletedGoals(): Goal[] {
    return this.getAllGoals().filter(goal => goal.completed);
  }

  /**
   * Actualiza una meta existente
   */
  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      const allGoals = this.getAllGoals();
      const index = allGoals.findIndex(goal => goal.id === id);

      if (index === -1) {
        throw new Error(`Meta con ID ${id} no encontrada`);
      }

      const existingGoal = allGoals[index];
      const updatedGoal: Goal = {
        ...existingGoal,
        ...updates,
        id: existingGoal.id,              // Mantén ID original
        currentAmount: existingGoal.currentAmount,
        createdAt: existingGoal.createdAt,
        updatedAt: new Date().toISOString(),
        completed: existingGoal.completed,
        completedAt: existingGoal.completedAt
      };

      allGoals[index] = updatedGoal;

      await this.saveGoals(allGoals);
      this.goalsSubject.next(allGoals);

      console.log('✅ Meta actualizada:', updatedGoal);
      return updatedGoal;
    } catch (error) {
      console.error('❌ Error al actualizar meta:', error);
      throw error;
    }
  }


  /**
   * Elimina una meta
   */
  async deleteGoal(id: string): Promise<void> {
    try {
      const allGoals = this.getAllGoals();
      const filteredGoals = allGoals.filter(goal => goal.id !== id);
      
      if (filteredGoals.length === allGoals.length) {
        throw new Error(`Meta con ID ${id} no encontrada`);
      }

      // También eliminamos las contribuciones asociadas
      const allContributions = this.contributionsSubject.getValue();
      const filteredContributions = allContributions.filter(contrib => contrib.goalId !== id);
      await this.saveContributions(filteredContributions);
      this.contributionsSubject.next(filteredContributions);

      await this.saveGoals(filteredGoals);
      this.goalsSubject.next(filteredGoals);
      
      console.log('🗑️ Meta eliminada:', id);
    } catch (error) {
      console.error('❌ Error al eliminar meta:', error);
      throw error;
    }
  }

  /**
   * Asigna dinero a una meta
   */
  async contributeToGoal(contribution: GoalContribution): Promise<Goal> {
    try {
      const allGoals = this.getAllGoals();
      const index = allGoals.findIndex(goal => goal.id === contribution.goalId);
      
      if (index === -1) {
        throw new Error(`Meta con ID ${contribution.goalId} no encontrada`);
      }

      const goal = allGoals[index];
      const newAmount = goal.currentAmount + contribution.amount;

      // Actualizamos la meta
      const updatedGoal: Goal = {
        ...goal,
        currentAmount: newAmount,
        updatedAt: new Date().toISOString(),
        completed: newAmount >= goal.targetAmount,
        completedAt: newAmount >= goal.targetAmount && !goal.completed 
          ? new Date().toISOString() 
          : goal.completedAt
      };

      allGoals[index] = updatedGoal;
      
      // Guardamos la contribución
      const allContributions = this.contributionsSubject.getValue();
      const newContributions = [...allContributions, contribution];
      await this.saveContributions(newContributions);
      this.contributionsSubject.next(newContributions);

      // Guardamos las metas actualizadas
      await this.saveGoals(allGoals);
      this.goalsSubject.next(allGoals);
      
      // Enviar notificación si la meta se completó
      if (updatedGoal.completed && !goal.completed) {
        await this.notificationService.notifyGoalCompleted(
          updatedGoal.name,
          updatedGoal.currentAmount
        );
      }
      
      console.log('💰 Contribución agregada a meta:', updatedGoal);
      return updatedGoal;
    } catch (error) {
      console.error('❌ Error al contribuir a meta:', error);
      throw error;
    }
  }

  /**
   * Calcula el progreso de una meta
   */
  calculateGoalProgress(goalId: string): GoalProgress | null {
    const goal = this.getGoalById(goalId);
    
    if (!goal) {
      return null;
    }

    const percentage = goal.targetAmount > 0 
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) 
      : 0;

    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

    let daysRemaining: number | undefined;
    let dailyRequired: number | undefined;
    let isOnTrack = true;

    if (goal.deadline) {
      const today = new Date();
      const deadlineDate = new Date(goal.deadline);
      const diffTime = deadlineDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0 && remaining > 0) {
        dailyRequired = remaining / daysRemaining;
      }

      // Verificamos si va por buen camino
      if (daysRemaining > 0) {
        const totalDays = Math.ceil(
          (deadlineDate.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysElapsed = totalDays - daysRemaining;
        const expectedProgress = (daysElapsed / totalDays) * 100;
        isOnTrack = percentage >= expectedProgress;
      } else {
        isOnTrack = goal.completed;
      }
    }

    let status: GoalProgress['status'];
    if (goal.completed) {
      status = 'completed';
    } else if (percentage === 0) {
      status = 'not-started';
    } else if (goal.deadline && daysRemaining !== undefined && daysRemaining < 0) {
      status = 'overdue';
    } else {
      status = 'in-progress';
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      percentage: Math.round(percentage * 10) / 10, // Redondear a 1 decimal
      remaining,
      daysRemaining,
      dailyRequired,
      isOnTrack,
      status
    };
  }

  /**
   * Obtiene el progreso de todas las metas activas
   */
  getAllGoalsProgress(): GoalProgress[] {
    const activeGoals = this.getActiveGoals();
    return activeGoals
      .map(goal => this.calculateGoalProgress(goal.id))
      .filter(progress => progress !== null) as GoalProgress[];
  }

  /**
   * Obtiene contribuciones de una meta específica
   */
  getGoalContributions(goalId: string): GoalContribution[] {
    return this.contributionsSubject.getValue()
      .filter(contrib => contrib.goalId === goalId);
  }

  /**
   * Obtiene un icono aleatorio
   */
  private getRandomIcon(): string {
    const randomIndex = Math.floor(Math.random() * DEFAULT_GOAL_ICONS.length);
    return DEFAULT_GOAL_ICONS[randomIndex];
  }

  /**
   * Obtiene un color aleatorio
   */
  private getRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * DEFAULT_GOAL_COLORS.length);
    return DEFAULT_GOAL_COLORS[randomIndex];
  }

  /**
   * Obtiene estadísticas generales de metas
   */
  getGoalsStatistics() {
    const allGoals = this.getAllGoals();
    const activeGoals = this.getActiveGoals();
    const completedGoals = this.getCompletedGoals();

    const totalTargetAmount = allGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSavedAmount = allGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalRemaining = totalTargetAmount - totalSavedAmount;

    const overallProgress = totalTargetAmount > 0 
      ? (totalSavedAmount / totalTargetAmount) * 100 
      : 0;

    return {
      totalGoals: allGoals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTargetAmount,
      totalSavedAmount,
      totalRemaining,
      overallProgress: Math.round(overallProgress * 10) / 10
    };
  }
}

