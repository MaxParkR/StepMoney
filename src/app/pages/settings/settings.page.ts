import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';
import { NotificationService } from '../../services/notification.service';
import { TransactionService } from '../../services/transaction.service';
import { GoalService } from '../../services/goal.service';

/**
 * Página de Configuración
 * 
 * Permite al usuario:
 * - Gestionar notificaciones
 * - Configurar preferencias
 * - Exportar/importar datos
 * - Ver información de la app
 * - Limpiar datos
 */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false
})
export class SettingsPage implements OnInit {

  // Configuración de notificaciones
  notificationSettings = {
    enabled: true,
    dailyReminder: true,
    dailyReminderTime: '20:00',
    goalAlerts: true,
    achievementAlerts: true,
    weeklyReport: true,
    weeklyReportDay: 0,
    weeklyReportTime: '10:00'
  };

  // Información de la app
  appVersion = '1.0.0';
  storageUsed = '0 KB';
  
  // Estadísticas
  stats = {
    totalTransactions: 0,
    totalGoals: 0,
    dataSize: 0
  };

  // Días de la semana
  weekDays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
  ];

  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService,
    private transactionService: TransactionService,
    private goalService: GoalService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    console.log('⚙️ Página de configuración cargada');
    await this.loadSettings();
    await this.loadStats();
  }

  /**
   * Carga la configuración guardada
   */
  async loadSettings() {
    try {
      const settings = await this.notificationService.getSettings();
      this.notificationSettings = settings;
      
      // Calcular uso de almacenamiento
      this.storageUsed = this.storageService.getStorageSizeFormatted();
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  }

  /**
   * Carga las estadísticas
   */
  async loadStats() {
    try {
      const transactions = this.transactionService.getAllTransactions();
      const goals = this.goalService.getAllGoals();
      
      this.stats = {
        totalTransactions: transactions.length,
        totalGoals: goals.length,
        dataSize: this.storageService.getStorageSize()
      };
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  /**
   * Guarda la configuración de notificaciones
   */
  async saveNotificationSettings() {
    try {
      await this.notificationService.saveSettings(this.notificationSettings);
      await this.showToast('Configuración guardada correctamente', 'success');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      await this.showToast('Error al guardar configuración', 'danger');
    }
  }

  /**
   * Cambia el estado de notificaciones
   */
  async toggleNotifications(event: any) {
    const enabled = event.detail.checked;
    
    if (enabled) {
      // Solicitar permisos si no están concedidos
      const hasPermission = await this.notificationService.requestPermissions();
      
      if (!hasPermission) {
        this.notificationSettings.enabled = false;
        await this.showAlert(
          'Permisos Requeridos',
          'Para activar las notificaciones, necesitas conceder permisos en la configuración de tu dispositivo.'
        );
        return;
      }
    }
    
    await this.saveNotificationSettings();
  }

  /**
   * Exporta todos los datos a JSON
   */
  async exportData() {
    try {
      const transactions = this.transactionService.getAllTransactions();
      const goals = this.goalService.getAllGoals();
      
      const exportData = {
        version: this.appVersion,
        exportDate: new Date().toISOString(),
        transactions,
        goals
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Crear elemento de descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = `stepmoney_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      await this.showToast('Datos exportados correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar datos:', error);
      await this.showToast('Error al exportar datos', 'danger');
    }
  }

  /**
   * Importa datos desde JSON
   */
  async importData() {
    const alert = await this.alertController.create({
      header: '⚠️ Importar Datos',
      message: 'Esta acción reemplazará todos tus datos actuales. ¿Estás seguro?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Continuar',
          handler: () => {
            // Crear input file
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e: any) => {
              const file = e.target.files[0];
              if (!file) return;
              
              try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Validar estructura
                if (!data.transactions || !data.goals) {
                  throw new Error('Formato de archivo inválido');
                }
                
                // Importar datos
                for (const transaction of data.transactions) {
                  await this.transactionService.createTransaction(transaction);
                }
                
                for (const goal of data.goals) {
                  await this.goalService.createGoal(goal);
                }
                
                await this.loadStats();
                await this.showToast('Datos importados correctamente', 'success');
              } catch (error) {
                console.error('Error al importar datos:', error);
                await this.showToast('Error al importar datos. Verifica el archivo.', 'danger');
              }
            };
            
            input.click();
          }
        }
      ]
    });
    
    await alert.present();
  }

  /**
   * Limpia todos los datos
   */
  async clearAllData() {
    const alert = await this.alertController.create({
      header: '⚠️ ¿Eliminar Todos los Datos?',
      message: 'Esta acción eliminará permanentemente todas tus transacciones y metas. Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar Todo',
          role: 'destructive',
          handler: async () => {
            try {
              await this.transactionService.clearAllTransactions();
              await this.storageService.remove('stepmoney_goals');
              await this.storageService.remove('stepmoney_goal_contributions');
              
              await this.loadStats();
              this.storageUsed = this.storageService.getStorageSizeFormatted();
              
              await this.showToast('Todos los datos han sido eliminados', 'success');
            } catch (error) {
              console.error('Error al limpiar datos:', error);
              await this.showToast('Error al eliminar datos', 'danger');
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  /**
   * Muestra información de la app
   */
  async showAbout() {
    const alert = await this.alertController.create({
      header: '💰 StepMoney',
      message: `
        <p><strong>Versión:</strong> ${this.appVersion}</p>
        <p><strong>Descripción:</strong> Tu asistente de finanzas personales</p>
        <br>
        <p>Desarrollado con Ionic Framework</p>
        <p>© 2025 StepMoney Team</p>
      `,
      buttons: ['Cerrar']
    });
    
    await alert.present();
  }

  /**
   * Muestra un toast
   */
  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  /**
   * Muestra una alerta
   */
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Abre la configuración del sistema
   */
  async openSystemSettings() {
    await this.showAlert(
      'Configuración del Sistema',
      'Ve a Configuración > Aplicaciones > StepMoney > Notificaciones para gestionar los permisos.'
    );
  }
}
