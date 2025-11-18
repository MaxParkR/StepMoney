import { Injectable } from '@angular/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { StorageService } from './storage.service';

/**
 * Servicio de Notificaciones Locales
 * 
 * Gestiona todas las notificaciones de la aplicación:
 * - Recordatorios para registrar gastos
 * - Alertas de metas próximas a vencer
 * - Notificaciones de logros
 * - Configuración de horarios
 * 
 * Usa Capacitor Local Notifications para funcionar en Android, iOS y Web
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  private readonly SETTINGS_KEY = 'notification_settings';
  
  // Configuración por defecto
  private defaultSettings = {
    enabled: true,
    dailyReminder: true,
    dailyReminderTime: '20:00', // 8:00 PM
    goalAlerts: true,
    achievementAlerts: true,
    weeklyReport: true,
    weeklyReportDay: 0, // 0 = Domingo
    weeklyReportTime: '10:00'
  };

  constructor(private storageService: StorageService) {
    console.log('🔔 NotificationService inicializado');
    this.initializeNotifications();
  }

  /**
   * Inicializa el servicio de notificaciones
   */
  private async initializeNotifications() {
    try {
      // Solicitar permisos
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        console.log('✅ Permisos de notificaciones concedidos');
        
        // Cargar configuración guardada
        const settings = await this.getSettings();
        
        // Programar notificaciones si están habilitadas
        if (settings.enabled) {
          await this.scheduleAllNotifications();
        }
      } else {
        console.log('⚠️ Permisos de notificaciones denegados');
      }
    } catch (error) {
      console.error('❌ Error al inicializar notificaciones:', error);
    }
  }

  /**
   * Obtiene la configuración de notificaciones
   */
  async getSettings() {
    try {
      const saved = await this.storageService.get(this.SETTINGS_KEY);
      return saved || this.defaultSettings;
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      return this.defaultSettings;
    }
  }

  /**
   * Guarda la configuración de notificaciones
   */
  async saveSettings(settings: any): Promise<void> {
    try {
      await this.storageService.set(this.SETTINGS_KEY, settings);
      
      // Reprogramar todas las notificaciones con la nueva configuración
      await this.cancelAllNotifications();
      if (settings.enabled) {
        await this.scheduleAllNotifications();
      }
      
      console.log('💾 Configuración de notificaciones guardada');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      throw error;
    }
  }

  /**
   * Programa todas las notificaciones según la configuración
   */
  private async scheduleAllNotifications(): Promise<void> {
    const settings = await this.getSettings();
    
    if (settings.dailyReminder) {
      await this.scheduleDailyReminder(settings.dailyReminderTime);
    }
    
    if (settings.weeklyReport) {
      await this.scheduleWeeklyReport(settings.weeklyReportDay, settings.weeklyReportTime);
    }
  }

  /**
   * Programa el recordatorio diario
   */
  async scheduleDailyReminder(time: string): Promise<void> {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0
      );
      
      // Si la hora ya pasó hoy, programar para mañana
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: '💰 Registra tus gastos',
            body: '¿Ya registraste lo que gastaste hoy? Mantén tu presupuesto al día',
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'day'
            },
            sound: 'default',
            actionTypeId: 'OPEN_APP',
            extra: {
              route: '/tabs/transactions'
            }
          }
        ]
      });

      console.log('🔔 Recordatorio diario programado para', time);
    } catch (error) {
      console.error('Error al programar recordatorio diario:', error);
    }
  }

  /**
   * Programa el reporte semanal
   */
  async scheduleWeeklyReport(dayOfWeek: number, time: string): Promise<void> {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0
      );
      
      // Ajustar al día de la semana correcto
      const currentDay = now.getDay();
      const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
      scheduledTime.setDate(scheduledTime.getDate() + daysToAdd);
      
      // Si es hoy pero la hora ya pasó, programar para la próxima semana
      if (daysToAdd === 0 && scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 7);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 2,
            title: '📊 Tu Reporte Semanal',
            body: 'Revisa cómo fue tu semana financiera y planifica la próxima',
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'week'
            },
            sound: 'default',
            actionTypeId: 'OPEN_APP',
            extra: {
              route: '/tabs/dashboard'
            }
          }
        ]
      });

      console.log('🔔 Reporte semanal programado');
    } catch (error) {
      console.error('Error al programar reporte semanal:', error);
    }
  }

  /**
   * Envía notificación de meta próxima a vencer
   */
  async notifyGoalDeadline(goalName: string, daysRemaining: number): Promise<void> {
    const settings = await this.getSettings();
    
    if (!settings.enabled || !settings.goalAlerts) {
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(), // ID único basado en timestamp
            title: '⏰ Meta próxima a vencer',
            body: `Tu meta "${goalName}" vence en ${daysRemaining} días. ¡Tú puedes lograrlo!`,
            schedule: {
              at: new Date(Date.now() + 1000) // Enviar inmediatamente
            },
            sound: 'default',
            actionTypeId: 'OPEN_APP',
            extra: {
              route: '/tabs/goals'
            }
          }
        ]
      });

      console.log('🔔 Notificación de meta enviada');
    } catch (error) {
      console.error('Error al enviar notificación de meta:', error);
    }
  }

  /**
   * Envía notificación de meta completada
   */
  async notifyGoalCompleted(goalName: string, amount: number): Promise<void> {
    const settings = await this.getSettings();
    
    if (!settings.enabled || !settings.achievementAlerts) {
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: '🎉 ¡Meta Completada!',
            body: `¡Felicidades! Has completado tu meta "${goalName}" con $${amount.toLocaleString()}`,
            schedule: {
              at: new Date(Date.now() + 1000)
            },
            sound: 'default',
            actionTypeId: 'OPEN_APP',
            extra: {
              route: '/tabs/goals'
            }
          }
        ]
      });

      console.log('🔔 Notificación de meta completada enviada');
    } catch (error) {
      console.error('Error al enviar notificación de logro:', error);
    }
  }

  /**
   * Envía notificación de presupuesto excedido
   */
  async notifyBudgetExceeded(amount: number): Promise<void> {
    const settings = await this.getSettings();
    
    if (!settings.enabled) {
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: '⚠️ Alerta de Presupuesto',
            body: `Has excedido tu presupuesto en $${amount.toLocaleString()}. Revisa tus gastos.`,
            schedule: {
              at: new Date(Date.now() + 1000)
            },
            sound: 'default',
            actionTypeId: 'OPEN_APP',
            extra: {
              route: '/tabs/dashboard'
            }
          }
        ]
      });

      console.log('🔔 Notificación de presupuesto enviada');
    } catch (error) {
      console.error('Error al enviar notificación de presupuesto:', error);
    }
  }

  /**
   * Cancela todas las notificaciones programadas
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
        console.log('🔕 Todas las notificaciones canceladas');
      }
    } catch (error) {
      console.error('Error al cancelar notificaciones:', error);
    }
  }

  /**
   * Cancela una notificación específica
   */
  async cancelNotification(id: number): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id }]
      });
      console.log(`🔕 Notificación ${id} cancelada`);
    } catch (error) {
      console.error('Error al cancelar notificación:', error);
    }
  }

  /**
   * Obtiene las notificaciones pendientes
   */
  async getPendingNotifications() {
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications;
    } catch (error) {
      console.error('Error al obtener notificaciones pendientes:', error);
      return [];
    }
  }

  /**
   * Verifica si las notificaciones están habilitadas
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.checkPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return false;
    }
  }

  /**
   * Solicita permisos de notificaciones
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.requestPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      return false;
    }
  }
}



