import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { UserProfileService } from '../../services/user-profile.service';
import { ProfileFormData } from '../../models/user-profile.model';

/**
 * Página de Onboarding
 * 
 * Muestra pantallas de bienvenida para nuevos usuarios y
 * permite configurar el perfil inicial.
 */
@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: false
})
export class OnboardingPage implements OnInit {

  // Control de pasos
  currentStep = 0;
  totalSteps = 3;

  // Datos del perfil
  userProfile = {
    name: '',
    email: '',
    currency: 'COP',
    monthlyIncome: null as number | null,
    savingsGoal: null as number | null,
    reminderTime: '20:00',
    enableNotifications: true
  };

  // Opciones de moneda
  currencies = [
    { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
    { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'MXN', name: 'Peso Mexicano', symbol: '$' }
  ];

  // Metas de ahorro sugeridas
  savingsGoals = [
    { icon: 'airplane', label: 'Viajes', amount: 5000000 },
    { icon: 'car', label: 'Vehículo', amount: 30000000 },
    { icon: 'home', label: 'Vivienda', amount: 50000000 },
    { icon: 'school', label: 'Educación', amount: 10000000 },
    { icon: 'medical', label: 'Emergencias', amount: 5000000 },
    { icon: 'sparkles', label: 'Otro', amount: 0 }
  ];

  selectedGoalType: string | null = null;

  // Validación
  isStepValid = false;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit() {
    this.validateCurrentStep();
  }

  /**
   * Avanza al siguiente paso
   */
  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.validateCurrentStep();
    } else {
      this.completeOnboarding();
    }
  }

  /**
   * Retrocede al paso anterior
   */
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.validateCurrentStep();
    }
  }

  /**
   * Salta el onboarding (opcional)
   */
  skipOnboarding() {
    this.completeOnboarding();
  }

  /**
   * Valida el paso actual
   */
  validateCurrentStep() {
    switch (this.currentStep) {
      case 0:
        // Paso de bienvenida - siempre válido
        this.isStepValid = true;
        break;
      case 1:
        // Paso de información básica
        this.isStepValid = this.userProfile.name.trim().length >= 2;
        break;
      case 2:
        // Paso de configuración financiera
        this.isStepValid = true; // Opcional
        break;
      default:
        this.isStepValid = true;
    }
  }

  /**
   * Maneja cambios en el nombre
   */
  onNameChange() {
    this.validateCurrentStep();
  }

  /**
   * Selecciona un tipo de meta
   */
  selectGoalType(goal: any) {
    this.selectedGoalType = goal.icon;
    if (goal.amount > 0) {
      this.userProfile.savingsGoal = goal.amount;
    }
  }

  /**
   * Completa el onboarding y guarda los datos
   */
  async completeOnboarding() {
    try {
      // Generar un username único basado en el nombre
      const username = this.generateUsername(this.userProfile.name || 'usuario');
      
      // Crear el perfil del usuario con la estructura correcta para UserProfileService
      const profileFormData: ProfileFormData = {
        fullName: this.userProfile.name || 'Usuario',
        username: username,
        email: this.userProfile.email || `${username}@stepmoney.local`,
        phone: '',
        birthDate: '',
        gender: '',
        bio: '',
        city: '',
        website: '',
        profileImage: ''
      };

      // Guardar el perfil usando el UserProfileService (esto guarda en 'current_user' y 'user_profiles')
      await this.userProfileService.saveUserProfile(profileFormData);
      console.log('✅ Perfil de usuario guardado correctamente');

      // Guardar que el onboarding fue completado
      await this.storageService.set('onboarding_complete', true);
      
      // Guardar también los datos adicionales del onboarding para referencia
      await this.storageService.set('user_preferences', {
        currency: this.userProfile.currency,
        monthlyIncome: this.userProfile.monthlyIncome,
        savingsGoal: this.userProfile.savingsGoal,
        reminderTime: this.userProfile.reminderTime,
        enableNotifications: this.userProfile.enableNotifications,
        createdAt: new Date().toISOString()
      });

      // Si hay un ingreso mensual, crear la primera transacción
      if (this.userProfile.monthlyIncome && this.userProfile.monthlyIncome > 0) {
        // Esto se puede hacer llamando al TransactionService
        console.log('💰 Ingreso mensual configurado:', this.userProfile.monthlyIncome);
      }

      // Navegar a la aplicación principal
      this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
      
    } catch (error) {
      console.error('Error al completar onboarding:', error);
    }
  }

  /**
   * Genera un username único basado en el nombre del usuario
   */
  private generateUsername(name: string): string {
    // Limpiar el nombre: quitar acentos, espacios y caracteres especiales
    const cleanName = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]/g, '') // Solo letras y números
      .substring(0, 15); // Máximo 15 caracteres
    
    // Agregar un sufijo numérico único
    const suffix = Date.now().toString().slice(-4);
    
    return cleanName ? `${cleanName}${suffix}` : `user${suffix}`;
  }

  /**
   * Formatea un número como moneda
   */
  formatCurrency(amount: number | null): string {
    if (!amount) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: this.userProfile.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Obtiene el saludo según la hora del día
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 18) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  }
}

